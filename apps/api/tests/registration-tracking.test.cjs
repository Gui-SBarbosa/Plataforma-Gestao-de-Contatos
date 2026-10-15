const { createHash } = require("node:crypto");
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

const adminEmail = "tracking-admin@example.com";
const pendingEmail = "tracking-pending@example.com";
const password = "tracking-test-password";
const trackingToken = "tracking-token-with-at-least-forty-three-characters";

describe("registration tracking", () => {
  let app;
  let httpServer;
  let ioClient;
  let prisma;
  let serverUrl;
  let statuses;

  beforeAll(async () => {
    const { hash } = await import("@node-rs/argon2");
    const { PrismaClient, UserRole, UserStatus } = await import("@prisma/client");
    const appModule = await import("../dist/app.js");
    const realtimeModule = await import("../dist/realtime/registration-realtime.js");
    const clientModule = await import("socket.io-client");
    app = appModule.createApp();
    httpServer = createServer(app);
    const realtime = realtimeModule.createRegistrationRealtime(httpServer, app.locals.sessionMiddleware);
    app.locals.publishRegistrationDecision = realtime.publishRegistrationDecision;
    ioClient = clientModule.io;
    prisma = new PrismaClient();
    statuses = UserStatus;
    const passwordHash = await hash(password, { algorithm: 2 });

    await new Promise((resolve) => httpServer.listen(0, "127.0.0.1", resolve));
    const { port } = httpServer.address();
    serverUrl = `http://127.0.0.1:${port}`;
    app.locals.fixturePasswordHash = passwordHash;
    app.locals.fixtureRoles = UserRole;
  });

  beforeEach(async () => {
    await prisma.rateLimitBucket.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, pendingEmail] } } });
    await prisma.user.createMany({
      data: [
        {
          email: adminEmail,
          name: "Tracking Admin",
          passwordHash: app.locals.fixturePasswordHash,
          role: app.locals.fixtureRoles.ADMIN,
          status: statuses.ACTIVE,
        },
        {
          email: pendingEmail,
          name: "Tracking Pending",
          passwordHash: app.locals.fixturePasswordHash,
          registrationTokenHash: createHash("sha256").update(trackingToken).digest("hex"),
          role: app.locals.fixtureRoles.OPERATOR,
          status: statuses.PENDING,
        },
      ],
    });
  });

  afterAll(async () => {
    if (!prisma) {
      return;
    }

    await prisma.rateLimitBucket.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany({ where: { email: { in: [adminEmail, pendingEmail] } } });
    await prisma.$disconnect();
    await new Promise((resolve) => httpServer.close(resolve));
  });

  const loginAdmin = async () => {
    const agent = request.agent(app);
    const csrf = await agent.get("/api/auth/csrf");
    const response = await agent
      .post("/api/auth/login")
      .set("X-CSRF-Token", csrf.body.data.csrfToken)
      .send({ email: adminEmail, password });

    expect(response.status).toBe(200);
    return { agent, csrfToken: response.body.data.csrfToken };
  };

  const connectSocket = () =>
    new Promise((resolve, reject) => {
      const socket = ioClient(serverUrl, {
        extraHeaders: { origin: process.env.APP_ORIGIN },
        transports: ["websocket"],
      });
      socket.once("connect", () => resolve(socket));
      socket.once("connect_error", reject);
    });

  const watchRegistration = (socket) =>
    new Promise((resolve) => {
      socket.emit("registration:watch", { trackingToken }, resolve);
    });

  const expectConnectionFailure = () =>
    new Promise((resolve) => {
      const socket = ioClient(serverUrl, { reconnection: false, transports: ["websocket"] });
      socket.once("connect_error", () => {
        socket.disconnect();
        resolve();
      });
    });

  it("returns only safe status data for a valid tracking token", async () => {
    const response = await request(app).get("/api/auth/registration-status").query({ trackingToken });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ decidedAt: null, status: "PENDING" });
    expect(response.body.data.id).toBeUndefined();
    expect(response.body.data.email).toBeUndefined();
  });

  it("limits tracking status queries", async () => {
    const unknownToken = "unknown-tracking-token-with-at-least-forty-three";

    for (let attempt = 0; attempt < 61; attempt += 1) {
      const response = await request(app).get("/api/auth/registration-status").query({ trackingToken: unknownToken });

      if (attempt < 60) {
        expect(response.status).toBe(404);
      } else {
        expect(response.status).toBe(429);
        expect(response.headers["retry-after"]).toEqual(expect.any(String));
        expect(response.headers["ratelimit-limit"]).toBe("60");
        expect(response.headers["ratelimit-remaining"]).toBe("0");
        expect(response.body.error).toMatchObject({ code: "RATE_LIMITED", message: "Unable to process the request." });
      }
    }
  });

  it("rejects a socket without the configured origin", async () => {
    await expect(expectConnectionFailure()).resolves.toBeUndefined();
  });

  it("pushes a persisted approval only to the authorized tracking socket", async () => {
    const socket = await connectSocket();
    const watch = await watchRegistration(socket);

    expect(watch).toMatchObject({ data: { decidedAt: null, status: "PENDING" }, ok: true });

    const event = new Promise((resolve) => socket.once("registration:approved", resolve));
    const { agent, csrfToken } = await loginAdmin();
    const pendingUser = await prisma.user.findUniqueOrThrow({ where: { email: pendingEmail } });
    const response = await agent.patch(`/api/admin/users/${pendingUser.id}/approve`).set("X-CSRF-Token", csrfToken);

    expect(response.status).toBe(200);
    await expect(event).resolves.toMatchObject({ decidedAt: expect.any(String), status: "ACTIVE" });
    socket.disconnect();
  });
});
