const { createServer } = require("node:http");
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

const adminEmail = "contact-realtime-admin@example.com";
const operatorEmail = "contact-realtime-operator@example.com";
const password = "Realtime1!";

describe("contact realtime notification", () => {
  let app;
  let httpServer;
  let ioClient;
  let prisma;
  let serverUrl;
  let users;

  beforeAll(async () => {
    const { hash } = await import("@node-rs/argon2");
    const { PrismaClient, UserRole, UserStatus } = await import("@prisma/client");
    const appModule = await import("../dist/app.js");
    const realtimeModule = await import("../dist/realtime/registration-realtime.js");
    const clientModule = await import("socket.io-client");
    app = appModule.createApp();
    httpServer = createServer(app);
    const realtime = realtimeModule.createRegistrationRealtime(httpServer, app.locals.sessionMiddleware);
    app.locals.publishContactCreated = realtime.publishContactCreated;
    app.locals.publishRegistrationDecision = realtime.publishRegistrationDecision;
    ioClient = clientModule.io;
    prisma = new PrismaClient();
    const emails = [adminEmail, operatorEmail];
    await prisma.contact.deleteMany({ where: { createdBy: { email: { in: emails } } } });
    await prisma.user.deleteMany({ where: { email: { in: emails } } });
    const passwordHash = await hash(password, { algorithm: 2 });
    await prisma.user.createMany({
      data: [
        { email: adminEmail, name: "Realtime Admin", passwordHash, role: UserRole.ADMIN, status: UserStatus.ACTIVE },
        { email: operatorEmail, name: "Realtime Operator", passwordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
      ],
    });
    users = await prisma.user.findMany({ where: { email: { in: emails } } });
    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const { port } = httpServer.address();
    serverUrl = `http://127.0.0.1:${port}`;
  });

  beforeEach(async () => {
    await prisma.rateLimitBucket.deleteMany();
    await prisma.contact.deleteMany({ where: { createdById: { in: users.map((user) => user.id) } } });
    await prisma.session.deleteMany();
  });

  afterAll(async () => {
    if (!prisma || !users) {
      return;
    }

    await prisma.contact.deleteMany({ where: { createdById: { in: users.map((user) => user.id) } } });
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { id: { in: users.map((user) => user.id) } } });
    await prisma.$disconnect();
    await new Promise((resolve) => httpServer.close(resolve));
  });

  const login = async (email) => {
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf.body.data.csrfToken)
      .send({ email, password });

    expect(response.status).toBe(200);
    return {
      agent,
      csrfToken: response.body.data.csrfToken,
      sessionCookie: response.headers["set-cookie"][0].split(";")[0],
    };
  };

  const connectSocket = (sessionCookie) =>
    new Promise((resolve, reject) => {
      const socket = ioClient(serverUrl, {
        extraHeaders: { cookie: sessionCookie, origin: process.env.APP_ORIGIN },
        transports: ["websocket"],
      });
      socket.once("connect", () => resolve(socket));
      socket.once("connect_error", reject);
    });

  it("notifies a session-authenticated administrator after contact persistence", async () => {
    const adminSession = await login(adminEmail);
    const adminSocket = await connectSocket(adminSession.sessionCookie);
    const event = new Promise((resolve) => adminSocket.once("contact:created", resolve));
    const operatorSession = await login(operatorEmail);
    const response = await operatorSession.agent.post("/api/contacts").set("X-CSRF-Token", operatorSession.csrfToken).send({
      email: "realtime-contact@example.com",
      name: "Realtime Contact",
      phone: "+55 62 99999-0000",
      source: "WEBSITE",
    });

    expect(response.status).toBe(201);
    const notification = await event;
    expect(notification).toMatchObject({
      contactId: response.body.data.contact.id,
      createdAt: expect.any(String),
      creatorName: "Realtime Operator",
    });
    await expect(prisma.contact.findUnique({ where: { id: notification.contactId } })).resolves.not.toBeNull();
    adminSocket.disconnect();
  });
});
