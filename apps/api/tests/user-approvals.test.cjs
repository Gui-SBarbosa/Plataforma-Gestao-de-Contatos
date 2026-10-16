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

const emails = {
  admin: "approval-admin@example.com",
  operator: "approval-operator@example.com",
  pendingOne: "approval-pending-one@example.com",
  pendingTwo: "approval-pending-two@example.com",
  pendingThree: "approval-pending-three@example.com",
};
const password = "ApprovalTest1!";

describe("operator request decisions", () => {
  let app;
  let prisma;
  let roles;
  let statuses;

  beforeAll(async () => {
    const [{ hash }, { PrismaClient, UserRole, UserStatus }, appModule] = await Promise.all([
      import("@node-rs/argon2"),
      import("@prisma/client"),
      import("../dist/app.js"),
    ]);
    app = appModule.createApp();
    prisma = new PrismaClient();
    roles = UserRole;
    statuses = UserStatus;
    const passwordHash = await hash(password, { algorithm: 2 });

    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.user.createMany({
      data: [
        { email: emails.admin, name: "Approval Admin", passwordHash, role: roles.ADMIN, status: statuses.ACTIVE },
        { email: emails.operator, name: "Approval Operator", passwordHash, role: roles.OPERATOR, status: statuses.ACTIVE },
        { email: emails.pendingOne, name: "Pending One", passwordHash, role: roles.OPERATOR, status: statuses.PENDING },
        { email: emails.pendingTwo, name: "Pending Two", passwordHash, role: roles.OPERATOR, status: statuses.PENDING },
        { email: emails.pendingThree, name: "Pending Three", passwordHash, role: roles.OPERATOR, status: statuses.PENDING },
      ],
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: Object.values(emails) } } });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.rateLimitBucket.deleteMany();
  });

  const login = async (email) => {
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf.body.data.csrfToken)
      .send({ email, password });

    expect(response.status).toBe(200);
    return { agent, csrfToken: response.body.data.csrfToken };
  };

  const findUser = (email) => prisma.user.findFirstOrThrow({ where: { email } });

  it("lists only pending operator requests with pagination", async () => {
    const { agent } = await login(emails.admin);
    const response = await agent.get("/api/admin/users?status=PENDING&page=1&pageSize=2");

    expect(response.status).toBe(200);
    expect(response.body.meta).toEqual({ page: 1, pageSize: 2, total: 3, totalPages: 2 });
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ role: "OPERATOR", status: "PENDING" }),
      ]),
    );
    expect(response.body.data[0].passwordHash).toBeUndefined();
    expect(response.body.data[0].registrationTokenHash).toBeUndefined();
  });

  it("approves a pending operator and records the administrator", async () => {
    const { agent, csrfToken } = await login(emails.admin);
    const [admin, pendingUser] = await Promise.all([findUser(emails.admin), findUser(emails.pendingOne)]);
    const response = await agent.patch(`/api/admin/users/${pendingUser.id}/approve`).set("X-CSRF-Token", csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({ id: pendingUser.id, status: "ACTIVE" });

    await expect(findUser(emails.pendingOne)).resolves.toMatchObject({
      approvedById: admin.id,
      approvedAt: expect.any(Date),
      status: statuses.ACTIVE,
    });

    const operatorSession = request.agent(app);
    const operatorCsrf = await operatorSession.get("/api/auth/csrf");
    const operatorLogin = await operatorSession
      .post("/api/auth/login")
      .set("X-CSRF-Token", operatorCsrf.body.data.csrfToken)
      .send({ email: emails.pendingOne, password });

    expect(operatorLogin.status).toBe(200);
  });

  it("rejects a pending operator and prevents authentication", async () => {
    const { agent, csrfToken } = await login(emails.admin);
    const pendingUser = await findUser(emails.pendingTwo);
    const response = await agent.patch(`/api/admin/users/${pendingUser.id}/reject`).set("X-CSRF-Token", csrfToken);

    expect(response.status).toBe(200);
    expect(response.body.data.user).toMatchObject({ id: pendingUser.id, status: "REJECTED" });
    await expect(prisma.user.findUnique({ where: { id: pendingUser.id } })).resolves.toMatchObject({ email: null, status: statuses.REJECTED });

    const rejectedSession = request.agent(app);
    const rejectedCsrf = await rejectedSession.get("/api/auth/csrf");
    const rejectedLogin = await rejectedSession
      .post("/api/auth/login")
      .set("X-CSRF-Token", rejectedCsrf.body.data.csrfToken)
      .send({ email: emails.pendingTwo, password });

    expect(rejectedLogin.status).toBe(401);
  });

  it("rejects a decision for a user that is no longer pending", async () => {
    const { agent, csrfToken } = await login(emails.admin);
    const pendingUser = await findUser(emails.pendingThree);

    expect((await agent.patch(`/api/admin/users/${pendingUser.id}/approve`).set("X-CSRF-Token", csrfToken)).status).toBe(200);

    const response = await agent.patch(`/api/admin/users/${pendingUser.id}/reject`).set("X-CSRF-Token", csrfToken);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe("INVALID_USER_TRANSITION");
  });

  it("requires an authenticated administrator and CSRF protection", async () => {
    const pendingUser = await findUser(emails.pendingThree);
    expect((await request(app).get("/api/admin/users")).status).toBe(401);

    const operator = await login(emails.operator);
    expect((await operator.agent.patch(`/api/admin/users/${pendingUser.id}/approve`).set("X-CSRF-Token", operator.csrfToken)).status).toBe(403);

    const admin = await login(emails.admin);
    const response = await admin.agent.patch(`/api/admin/users/${pendingUser.id}/approve`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_INVALID");
  });
});
