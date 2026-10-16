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

const activeUserEmail = "auth-active-test@example.com";
const disabledUserEmail = "auth-disabled-test@example.com";
const pendingUserEmail = "auth-pending-test@example.com";
const password = "AuthTest1!";
const rejectedUserEmail = "auth-rejected-test@example.com";

describe("authentication endpoints", () => {
  let app;
  let createApp;
  let prisma;

  beforeAll(async () => {
    const [{ hash }, { PrismaClient, UserRole, UserStatus }, appModule] = await Promise.all([
      import("@node-rs/argon2"),
      import("@prisma/client"),
      import("../dist/app.js"),
    ]);
    prisma = new PrismaClient();
    ({ createApp } = appModule);
    app = createApp();

    const passwordHash = await hash(password, { algorithm: 2 });
    await prisma.rateLimitBucket.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({
      where: { name: { in: ["Active Test", "Disabled Test", "Pending Test", "Rejected Test"] } },
    });
    await prisma.user.createMany({
      data: [
        { name: "Active Test", email: activeUserEmail, passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        { name: "Disabled Test", email: null, passwordHash, role: UserRole.OPERATOR, status: UserStatus.DISABLED },
        { name: "Pending Test", email: pendingUserEmail, passwordHash, role: UserRole.OPERATOR, status: UserStatus.PENDING },
        { name: "Rejected Test", email: null, passwordHash, role: UserRole.OPERATOR, status: UserStatus.REJECTED },
      ],
    });
  });

  afterAll(async () => {
    await prisma.rateLimitBucket.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({
      where: { name: { in: ["Active Test", "Disabled Test", "Pending Test", "Rejected Test"] } },
    });
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.rateLimitBucket.deleteMany();
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

  it("keeps an authenticated session after a new application instance starts", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const loginResponse = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrfToken)
      .send({ email: activeUserEmail, password });
    const sessionCookie = loginResponse.headers["set-cookie"][0].split(";")[0];
    const restartedResponse = await request(createApp()).get("/api/auth/me").set("Cookie", sessionCookie);

    expect(restartedResponse.status).toBe(200);
    expect(restartedResponse.body.data.user).toMatchObject({ email: activeUserEmail, status: "ACTIVE" });
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

  it("keeps the identity limit after a new application instance starts", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrfToken)
        .send({ email: activeUserEmail, password: "invalid-password" });

      expect(response.status).toBe(401);
    }

    const restartedAgent = request.agent(createApp());
    const restartedCsrfToken = await getCsrfToken(restartedAgent);
    const blockedResponse = await restartedAgent
      .post("/api/auth/login")
      .set("X-CSRF-Token", restartedCsrfToken)
      .send({ email: activeUserEmail, password: "invalid-password" });

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers["retry-after"]).toEqual(expect.any(String));
    expect(blockedResponse.body.error).toMatchObject({ code: "RATE_LIMITED", message: "Unable to process the request." });
  });

  it("atomically enforces the shared IP limit across concurrent application instances", async () => {
    const firstAgent = request.agent(app);
    const secondAgent = request.agent(createApp());
    const [firstCsrfToken, secondCsrfToken] = await Promise.all([getCsrfToken(firstAgent), getCsrfToken(secondAgent)]);
    const requests = Array.from({ length: 20 }, (_, index) => {
      const agent = index % 2 === 0 ? firstAgent : secondAgent;
      const csrfToken = index % 2 === 0 ? firstCsrfToken : secondCsrfToken;

      return agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrfToken)
        .send({ email: `rate-limit-${index}@example.com`, password: "invalid-password" });
    });
    const responses = await Promise.all(requests);

    expect(responses).toHaveLength(20);
    expect(responses.every((response) => response.status === 401)).toBe(true);

    const blockedResponse = await firstAgent
      .post("/api/auth/login")
      .set("X-CSRF-Token", firstCsrfToken)
      .send({ email: "rate-limit-overflow@example.com", password: "invalid-password" });

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.headers["ratelimit-limit"]).toBe("20");
    expect(blockedResponse.headers["ratelimit-remaining"]).toBe("0");
    expect(blockedResponse.headers["retry-after"]).toEqual(expect.any(String));
  });

  it("returns the same generic 429 response for known and unknown accounts", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const requests = Array.from({ length: 20 }, (_, index) =>
      agent
        .post("/api/auth/login")
        .set("X-CSRF-Token", csrfToken)
        .send({ email: `limit-generic-${index}@example.com`, password: "invalid-password" }),
    );

    await Promise.all(requests);
    const [knownResponse, unknownResponse] = await Promise.all([
      agent.post("/api/auth/login").set("X-CSRF-Token", csrfToken).send({ email: activeUserEmail, password: "invalid-password" }),
      agent.post("/api/auth/login").set("X-CSRF-Token", csrfToken).send({ email: "unknown@example.com", password: "invalid-password" }),
    ]);

    for (const response of [knownResponse, unknownResponse]) {
      expect(response.status).toBe(429);
      expect(response.headers["retry-after"]).toEqual(expect.any(String));
      expect(response.body.error).toMatchObject({ code: "RATE_LIMITED", message: "Unable to process the request." });
      expect(response.body.data).toBeUndefined();
    }
  });
});
