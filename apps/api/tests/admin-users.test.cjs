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

    await expect(prisma.user.findUnique({ where: { email: createdOperatorEmail } })).resolves.toMatchObject({
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
});
