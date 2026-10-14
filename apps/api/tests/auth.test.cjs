const path = require("node:path");

const { config } = require("dotenv");
const request = require("supertest");

config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });
process.env.APP_ORIGIN = "http://localhost:5173";
process.env.CSRF_SECRET = "test-csrf-secret-with-at-least-thirty-two-characters";
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = "test";
process.env.SESSION_SECRET = "test-session-secret-with-at-least-thirty-two-characters";

const activeUserEmail = "auth-active-test@example.com";
const disabledUserEmail = "auth-disabled-test@example.com";
const pendingUserEmail = "auth-pending-test@example.com";
const password = "test-password-for-authentication";
const rejectedUserEmail = "auth-rejected-test@example.com";

describe("authentication endpoints", () => {
  let app;
  let prisma;

  beforeAll(async () => {
    const [{ hash }, { PrismaClient, UserRole, UserStatus }, appModule] = await Promise.all([
      import("@node-rs/argon2"),
      import("@prisma/client"),
      import("../dist/app.js"),
    ]);
    prisma = new PrismaClient();
    app = appModule.createApp();

    const passwordHash = await hash(password, { algorithm: 2 });
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { in: [activeUserEmail, disabledUserEmail, pendingUserEmail, rejectedUserEmail] } },
    });
    await prisma.user.createMany({
      data: [
        { name: "Active Test", email: activeUserEmail, passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        { name: "Disabled Test", email: disabledUserEmail, passwordHash, role: UserRole.OPERATOR, status: UserStatus.DISABLED },
        { name: "Pending Test", email: pendingUserEmail, passwordHash, role: UserRole.OPERATOR, status: UserStatus.PENDING },
        { name: "Rejected Test", email: rejectedUserEmail, passwordHash, role: UserRole.OPERATOR, status: UserStatus.REJECTED },
      ],
    });
  });

  afterAll(async () => {
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({
      where: { email: { in: [activeUserEmail, disabledUserEmail, pendingUserEmail, rejectedUserEmail] } },
    });
    await prisma.$disconnect();
  });

  const getCsrfToken = async (agent) => {
    const response = await agent.get("/api/auth/csrf");

    expect(response.status).toBe(200);
    expect(response.body.data.csrfToken).toEqual(expect.any(String));

    return response.body.data.csrfToken;
  };

  it("rejects a login without a CSRF token", async () => {
    const response = await request(app).post("/api/auth/login").send({ email: activeUserEmail, password });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_INVALID");
  });

  it("creates a session for an active user and returns the current user", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({ email: activeUserEmail.toUpperCase(), password });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.user).toMatchObject({ email: activeUserEmail, role: "ADMIN", status: "ACTIVE" });
    expect(loginResponse.body.data.user.passwordHash).toBeUndefined();

    const currentUserResponse = await agent.get("/api/auth/me");

    expect(currentUserResponse.status).toBe(200);
    expect(currentUserResponse.body.data.user.email).toBe(activeUserEmail);
  });

  it.each([disabledUserEmail, pendingUserEmail, rejectedUserEmail])(
    "rejects a non-active user without creating a session",
    async (email) => {
      const agent = request.agent(app);
      const csrfToken = await getCsrfToken(agent);
      const loginResponse = await agent.post("/api/auth/login").set("X-CSRF-Token", csrfToken).send({ email, password });

      expect(loginResponse.status).toBe(401);
      expect(loginResponse.body.error.code).toBe("INVALID_CREDENTIALS");

      const currentUserResponse = await agent.get("/api/auth/me");

      expect(currentUserResponse.status).toBe(401);
    },
  );

  it("destroys the session on logout", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({ email: activeUserEmail, password });
    const logoutResponse = await agent.post("/api/auth/logout").set("X-CSRF-Token", loginResponse.body.data.csrfToken);

    expect(logoutResponse.status).toBe(204);

    const currentUserResponse = await agent.get("/api/auth/me");

    expect(currentUserResponse.status).toBe(401);
  });
});
