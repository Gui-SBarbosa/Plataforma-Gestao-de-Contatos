const path = require("node:path");

const { config } = require("dotenv");
const request = require("supertest");

config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });
process.env.APP_ORIGIN = "http://localhost:5173";
process.env.CSRF_SECRET = "test-csrf-secret-with-at-least-thirty-two-characters";
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_SECRET = "test-rate-limit-secret-with-at-least-thirty-two-characters";
process.env.SESSION_SECRET = "test-session-secret-with-at-least-thirty-two-characters";

const adminEmail = "admin-user-test@example.com";
const createdOperatorEmail = "created-operator-test@example.com";
const operatorEmail = "operator-user-test@example.com";
const password = "admin-user-test-password";

describe("admin user creation", () => {
  let app;
  let prisma;

  beforeAll(async () => {
    const [{ hash }, { PrismaClient, UserRole, UserStatus }, appModule] = await Promise.all([
      import("@node-rs/argon2"),
      import("@prisma/client"),
      import("../dist/app.js"),
    ]);
    app = appModule.createApp();
    prisma = new PrismaClient();
    const passwordHash = await hash(password, { algorithm: 2 });
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, createdOperatorEmail, operatorEmail] } } });
    await prisma.user.createMany({
      data: [
        { email: adminEmail, name: "Admin Test", passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        { email: operatorEmail, name: "Operator Test", passwordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
      ],
    });
  });

  afterEach(async () => {
    await prisma.user.deleteMany({ where: { email: createdOperatorEmail } });
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, createdOperatorEmail, operatorEmail] } } });
    await prisma.$disconnect();
  });

  const login = async (email) => {
    const agent = request.agent(app);
    const csrfResponse = await agent.get("/api/auth/csrf");
    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfResponse.body.data.csrfToken)
      .send({ email, password });

    expect(loginResponse.status).toBe(200);
    return { agent, csrfToken: loginResponse.body.data.csrfToken };
  };

  const input = { email: createdOperatorEmail, name: "Created Operator", password };

  it("allows an administrator to create an active operator", async () => {
    const { agent, csrfToken } = await login(adminEmail);
    const response = await agent.post("/api/admin/users").set("X-CSRF-Token", csrfToken).send(input);

    expect(response.status).toBe(201);
    expect(response.body.data.user).toMatchObject({ email: createdOperatorEmail, role: "OPERATOR", status: "ACTIVE" });
    expect(response.body.data.user.passwordHash).toBeUndefined();

    await expect(prisma.user.findFirst({ where: { email: createdOperatorEmail } })).resolves.toMatchObject({
      role: "OPERATOR",
      status: "ACTIVE",
    });

    const operatorSession = request.agent(app);
    const operatorCsrf = await operatorSession.get("/api/auth/csrf");
    const operatorLogin = await operatorSession
      .post("/api/auth/login")
      .set("X-CSRF-Token", operatorCsrf.body.data.csrfToken)
      .send({ email: createdOperatorEmail, password });

    expect(operatorLogin.status).toBe(200);
  });

  it("rejects a non-administrator", async () => {
    const { agent, csrfToken } = await login(operatorEmail);
    const response = await agent.post("/api/admin/users").set("X-CSRF-Token", csrfToken).send(input);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects an unauthenticated request", async () => {
    const response = await request(app).post("/api/admin/users").send(input);

    expect(response.status).toBe(401);
  });

  it("rejects an administrator request without a CSRF token", async () => {
    const { agent } = await login(adminEmail);
    const response = await agent.post("/api/admin/users").send(input);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_INVALID");
  });

  it("allows reusing an email after operator deactivation", async () => {
    const { agent, csrfToken } = await login(adminEmail);
    const first = await agent.post("/api/admin/users").set("X-CSRF-Token", csrfToken).send(input);
    expect(first.status).toBe(201);

    const disableCsrf = await agent.get("/api/auth/csrf");
    const disabled = await agent.delete(`/api/admin/users/${first.body.data.user.id}`).set("X-CSRF-Token", disableCsrf.body.data.csrfToken);
    expect(disabled.status).toBe(200);
    expect(disabled.body.data.user.email).toBeNull();

    const createCsrf = await agent.get("/api/auth/csrf");
    const second = await agent.post("/api/admin/users").set("X-CSRF-Token", createCsrf.body.data.csrfToken).send(input);
    expect(second.status).toBe(201);

    await prisma.user.deleteMany({ where: { name: { in: ["Created Operator", "Created Operator"] } } });
  });

  it("lists, updates, deactivates and reactivates operators", async () => {
    const { agent, csrfToken } = await login(adminEmail);
    const created = await agent.post("/api/admin/users").set("X-CSRF-Token", csrfToken).send(input);
    expect(created.status).toBe(201);

    const listed = await agent.get("/api/admin/users/operators");
    expect(listed.status).toBe(200);
    expect(listed.body.data).toEqual(expect.arrayContaining([expect.objectContaining({ id: created.body.data.user.id, status: "ACTIVE" })]));
    expect(listed.body.data[0].passwordHash).toBeUndefined();

    const updateCsrf = await agent.get("/api/auth/csrf");
    const updated = await agent.patch(`/api/admin/users/${created.body.data.user.id}`).set("X-CSRF-Token", updateCsrf.body.data.csrfToken).send({ email: createdOperatorEmail, name: "Updated Operator" });
    expect(updated.status).toBe(200);
    expect(updated.body.data.user.name).toBe("Updated Operator");

    const disableCsrf = await agent.get("/api/auth/csrf");
    const disabled = await agent.delete(`/api/admin/users/${created.body.data.user.id}`).set("X-CSRF-Token", disableCsrf.body.data.csrfToken);
    expect(disabled.status).toBe(200);
    expect(disabled.body.data.user.status).toBe("DISABLED");

    expect(disabled.body.data.user.email).toBeNull();

    const activateCsrf = await agent.get("/api/auth/csrf");
    const activated = await agent.patch(`/api/admin/users/${created.body.data.user.id}/activate`).set("X-CSRF-Token", activateCsrf.body.data.csrfToken).send({ email: createdOperatorEmail });
    expect(activated.status).toBe(200);
    expect(activated.body.data.user.status).toBe("ACTIVE");
  });
});
