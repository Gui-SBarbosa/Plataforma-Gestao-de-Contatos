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

const operatorEmail = "contact-operator-test@example.com";
const password = "contact-operator-test-password";

describe("contact creation", () => {
  let app;
  let operator;
  let prisma;

  beforeAll(async () => {
    const [{ hash }, { PrismaClient, UserRole, UserStatus }, appModule] = await Promise.all([
      import("@node-rs/argon2"),
      import("@prisma/client"),
      import("../dist/app.js"),
    ]);
    app = appModule.createApp();
    prisma = new PrismaClient();
    await prisma.contact.deleteMany({ where: { createdBy: { email: operatorEmail } } });
    await prisma.user.deleteMany({ where: { email: operatorEmail } });
    operator = await prisma.user.create({
      data: {
        email: operatorEmail,
        name: "Contact Operator",
        passwordHash: await hash(password, { algorithm: 2 }),
        role: UserRole.OPERATOR,
        status: UserStatus.ACTIVE,
      },
    });
  });

  beforeEach(async () => {
    await prisma.contact.deleteMany({ where: { createdById: operator.id } });
    await prisma.session.deleteMany();
  });

  afterAll(async () => {
    await prisma.contact.deleteMany({ where: { createdById: operator.id } });
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { id: operator.id } });
    await prisma.$disconnect();
  });

  const login = async () => {
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf.body.data.csrfToken)
      .send({ email: operatorEmail, password });

    expect(response.status).toBe(200);
    return { agent, csrfToken: response.body.data.csrfToken };
  };

  const input = {
    city: "Anápolis",
    company: "GestCon",
    email: "CONTACT@EXAMPLE.COM",
    name: "Contact Example",
    phone: "+55 62 99999-0000",
    source: "REFERRAL",
  };

  it("creates a contact attributed to the authenticated operator", async () => {
    const { agent, csrfToken } = await login();
    const response = await agent.post("/api/contacts").set("X-CSRF-Token", csrfToken).send(input);

    expect(response.status).toBe(201);
    expect(response.body.data.contact).toMatchObject({ ...input, email: "contact@example.com" });
    expect(response.body.data.contact.createdById).toBeUndefined();

    await expect(prisma.contact.findUnique({ where: { id: response.body.data.contact.id } })).resolves.toMatchObject({
      createdById: operator.id,
      email: "contact@example.com",
    });
  });

  it("rejects invalid contact input", async () => {
    const { agent, csrfToken } = await login();
    const response = await agent.post("/api/contacts").set("X-CSRF-Token", csrfToken).send({ ...input, source: "INVALID" });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("requires authentication and CSRF protection", async () => {
    expect((await request(app).post("/api/contacts").send(input)).status).toBe(401);

    const { agent } = await login();
    const response = await agent.post("/api/contacts").send(input);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("CSRF_INVALID");
  });
});
