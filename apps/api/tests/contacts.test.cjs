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
const otherOperatorEmail = "other-contact-operator-test@example.com";
const adminEmail = "contact-admin-test@example.com";
const password = "contact-operator-test-password";

describe("contact creation", () => {
  let app;
  let admin;
  let otherOperator;
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
    const emails = [operatorEmail, otherOperatorEmail, adminEmail];
    await prisma.contact.deleteMany({ where: { createdBy: { email: { in: emails } } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    const passwordHash = await hash(password, { algorithm: 2 });
    await prisma.user.createMany({
      data: [
        { email: operatorEmail, name: "Contact Operator", passwordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
        { email: otherOperatorEmail, name: "Other Contact Operator", passwordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
        { email: adminEmail, name: "Contact Admin", passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      ],
    });
    [operator, otherOperator, admin] = await Promise.all(
      emails.map((email) => prisma.user.findUniqueOrThrow({ where: { email } })),
    );
  });

  beforeEach(async () => {
    await prisma.contact.deleteMany({ where: { createdById: { in: [operator.id, otherOperator.id, admin.id] } } });
    await prisma.session.deleteMany();
  });

  afterAll(async () => {
    await prisma.contact.deleteMany({ where: { createdById: { in: [operator.id, otherOperator.id, admin.id] } } });
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { id: { in: [operator.id, otherOperator.id, admin.id] } } });
    await prisma.$disconnect();
  });

  const login = async (email = operatorEmail) => {
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf.body.data.csrfToken)
      .send({ email, password });

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

  it("returns only a contact owned by the authenticated operator", async () => {
    const contact = await prisma.contact.create({ data: { ...input, createdById: operator.id, email: "owned@example.com" } });
    const { agent } = await login();
    const response = await agent.get(`/api/contacts/${contact.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data.contact).toMatchObject({ id: contact.id, email: "owned@example.com" });
    expect(response.body.data.contact.createdById).toBeUndefined();
  });

  it("hides another operator contact and allows administrator access", async () => {
    const contact = await prisma.contact.create({ data: { ...input, createdById: otherOperator.id, email: "other@example.com" } });
    const operatorSession = await login();
    const operatorResponse = await operatorSession.agent.get(`/api/contacts/${contact.id}`);

    expect(operatorResponse.status).toBe(404);
    expect(operatorResponse.body.error.code).toBe("CONTACT_NOT_FOUND");

    const adminSession = await login(adminEmail);
    const adminResponse = await adminSession.agent.get(`/api/contacts/${contact.id}`);

    expect(adminResponse.status).toBe(200);
    expect(adminResponse.body.data.contact).toMatchObject({ id: contact.id, email: "other@example.com" });
  });
});
