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

const adminEmail = "dashboard-admin-test@example.com";
const operatorEmail = "dashboard-operator-test@example.com";
const otherOperatorEmail = "dashboard-other-operator-test@example.com";
const password = "dashboard-test-password";

describe("dashboard metrics", () => {
  let admin;
  let app;
  let operator;
  let otherOperator;
  let prisma;

  beforeAll(async () => {
    const [{ hash }, { PrismaClient, UserRole, UserStatus }, appModule] = await Promise.all([
      import("@node-rs/argon2"),
      import("@prisma/client"),
      import("../dist/app.js"),
    ]);
    app = appModule.createApp();
    prisma = new PrismaClient();
    const emails = [adminEmail, operatorEmail, otherOperatorEmail];
    await prisma.contact.deleteMany({ where: { createdBy: { email: { in: emails } } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    const passwordHash = await hash(password, { algorithm: 2 });
    await prisma.user.createMany({
      data: [
        { email: adminEmail, name: "Dashboard Admin", passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        { email: operatorEmail, name: "Dashboard Operator", passwordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
        { email: otherOperatorEmail, name: "Dashboard Other Operator", passwordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
      ],
    });
    [admin, operator, otherOperator] = await Promise.all(emails.map((email) => prisma.user.findFirstOrThrow({ where: { email } })));
  });

  beforeEach(async () => {
    await prisma.contact.deleteMany({ where: { createdById: { in: [admin.id, operator.id, otherOperator.id] } } });
    await prisma.session.deleteMany();
    await prisma.contact.createMany({
      data: [
        { name: "Owned", email: "dashboard-owned@example.com", phone: "123456", source: "WEBSITE", createdById: operator.id },
        { name: "Other", email: "dashboard-other@example.com", phone: "123456", source: "PHONE", createdById: otherOperator.id },
      ],
    });
  });

  afterAll(async () => {
    await prisma.contact.deleteMany({ where: { createdById: { in: [admin.id, operator.id, otherOperator.id] } } });
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { id: { in: [admin.id, operator.id, otherOperator.id] } } });
    await prisma.$disconnect();
  });

  const login = async (email) => {
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent.post("/api/auth/login").set("X-CSRF-Token", csrf.body.data.csrfToken).send({ email, password });

    expect(response.status).toBe(200);
    return agent;
  };

  it("limits an operator dashboard to owned contacts", async () => {
    const agent = await login(operatorEmail);
    const response = await agent.get("/api/dashboard?interval=day");

    expect(response.status).toBe(200);
    expect(response.body.data.summary.contacts).toBe(1);
    expect(response.body.data.bySource).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "WEBSITE", total: 1 }),
      expect.objectContaining({ source: "PHONE", total: 0 }),
    ]));
    expect(response.body.data.byOperator).toEqual([]);
    expect(response.body.data.availableOperators).toEqual([]);
  });

  it("returns global metrics and filters by operator for an administrator", async () => {
    const agent = await login(adminEmail);
    const global = await agent.get("/api/dashboard?interval=week");

    expect(global.status).toBe(200);
    expect(global.body.data.summary.contacts).toBe(2);
    expect(global.body.data.byOperator).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: operator.id, total: 1 }),
      expect.objectContaining({ id: otherOperator.id, total: 1 }),
    ]));
    expect(global.body.data.availableOperators).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: operator.id }),
      expect.objectContaining({ id: otherOperator.id }),
    ]));
    expect(global.body.data.series).toHaveLength(1);

    const filtered = await agent.get(`/api/dashboard?operatorId=${operator.id}&interval=day`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data.summary.contacts).toBe(1);
    expect(filtered.body.data.byOperator).toEqual([expect.objectContaining({ id: operator.id, total: 1 })]);
  });

  it("rejects an operator selecting another operator", async () => {
    const agent = await login(operatorEmail);
    const response = await agent.get(`/api/dashboard?operatorId=${otherOperator.id}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  it("rejects invalid dashboard filters", async () => {
    const agent = await login(adminEmail);
    const invalidInterval = await agent.get("/api/dashboard?interval=quarter");
    const invalidRange = await agent.get("/api/dashboard?from=2026-10-16&to=2026-10-15");

    expect(invalidInterval.status).toBe(400);
    expect(invalidInterval.body.error.code).toBe("VALIDATION_ERROR");
    expect(invalidRange.status).toBe(400);
    expect(invalidRange.body.error.code).toBe("VALIDATION_ERROR");
  });
});
