const { createHash } = require("node:crypto");
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

const registrationEmails = [
  "registration-one@example.com",
  "registration-two@example.com",
  "registration-three@example.com",
  "registration-four@example.com",
  "registration-five@example.com",
  "registration-six@example.com",
];
const password = "Registration1!";

describe("public operator registration", () => {
  let app;
  let prisma;
  let verify;

  beforeAll(async () => {
    const [{ verify: verifyPassword }, { PrismaClient }, appModule] = await Promise.all([
      import("@node-rs/argon2"),
      import("@prisma/client"),
      import("../dist/app.js"),
    ]);
    app = appModule.createApp();
    prisma = new PrismaClient();
    verify = verifyPassword;
  });

  beforeEach(async () => {
    await prisma.rateLimitBucket.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: registrationEmails } } });
  });

  afterAll(async () => {
    await prisma.rateLimitBucket.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: registrationEmails } } });
    await prisma.$disconnect();
  });

  const getCsrfToken = async (agent) => {
    const response = await agent.get("/api/auth/csrf");

    expect(response.status).toBe(200);
    return response.body.data.csrfToken;
  };

  it("creates a pending operator with protected credentials and tracking token", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const response = await agent
      .post("/api/auth/register")
      .set("X-CSRF-Token", csrfToken)
      .send({ email: registrationEmails[0].toUpperCase(), name: "Operator Request", password });

    expect(response.status).toBe(202);
    expect(response.body.data).toMatchObject({ status: "PENDING", trackingToken: expect.any(String) });

    const user = await prisma.user.findFirst({ where: { email: registrationEmails[0] } });

    expect(user).toMatchObject({ email: registrationEmails[0], name: "Operator Request", role: "OPERATOR", status: "PENDING" });
    expect(user.passwordHash).not.toBe(password);
    await expect(verify(user.passwordHash, password)).resolves.toBe(true);
    expect(user.registrationTokenHash).toBe(createHash("sha256").update(response.body.data.trackingToken).digest("hex"));
  });

  it("rejects duplicate registrations without creating a session", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);
    const input = { email: registrationEmails[0], name: "Operator Request", password };

    expect((await agent.post("/api/auth/register").set("X-CSRF-Token", csrfToken).send(input)).status).toBe(202);

    const conflictResponse = await agent.post("/api/auth/register").set("X-CSRF-Token", csrfToken).send(input);
    const currentUserResponse = await agent.get("/api/auth/me");

    expect(conflictResponse.status).toBe(409);
    expect(conflictResponse.body.error).toMatchObject({ code: "REGISTRATION_CONFLICT", message: "Unable to process the request." });
    expect(currentUserResponse.status).toBe(401);
  });

  it("limits registrations by IP", async () => {
    const agent = request.agent(app);
    const csrfToken = await getCsrfToken(agent);

    for (const [index, email] of registrationEmails.entries()) {
      const response = await agent
        .post("/api/auth/register")
        .set("X-CSRF-Token", csrfToken)
        .send({ email, name: `Operator ${index}`, password });

      if (index < 5) {
        expect(response.status).toBe(202);
      } else {
        expect(response.status).toBe(429);
        expect(response.headers["retry-after"]).toEqual(expect.any(String));
        expect(response.headers["ratelimit-limit"]).toBe("5");
        expect(response.headers["ratelimit-remaining"]).toBe("0");
        expect(response.body.error.code).toBe("RATE_LIMITED");
      }
    }
  });
});
