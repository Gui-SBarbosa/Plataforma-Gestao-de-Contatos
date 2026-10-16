const path = require("node:path");

const { config } = require("dotenv");

config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });
process.env.APP_ORIGIN = "http://localhost:5173";
process.env.CSRF_SECRET = "test-csrf-secret-with-at-least-thirty-two-characters";
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_SECRET = "test-rate-limit-secret-with-at-least-thirty-two-characters";
process.env.SESSION_SECRET = "test-session-secret-with-at-least-thirty-two-characters";

const expiredScope = "CLEANUP_TEST_EXPIRED";
const freshScope = "CLEANUP_TEST_FRESH";

describe("rate limit cleanup job", () => {
  let cleanupExpiredRateLimitBuckets;
  let prisma;

  beforeAll(async () => {
    const [{ PrismaClient }, cleanupModule] = await Promise.all([
      import("@prisma/client"),
      import("../dist/modules/rate-limit/rate-limit.cleanup.js"),
    ]);
    prisma = new PrismaClient();
    cleanupExpiredRateLimitBuckets = cleanupModule.cleanupExpiredRateLimitBuckets;
  });

  beforeEach(async () => {
    await prisma.rateLimitBucket.deleteMany({ where: { scope: { in: [expiredScope, freshScope] } } });
  });

  afterAll(async () => {
    await prisma.rateLimitBucket.deleteMany({ where: { scope: { in: [expiredScope, freshScope] } } });
    await prisma.$disconnect();
  });

  it("deletes only expired buckets and is idempotent", async () => {
    const now = new Date("2026-10-14T12:00:00.000Z");
    await prisma.rateLimitBucket.createMany({
      data: [
        {
          count: 1,
          expiresAt: new Date("2026-10-14T11:59:59.000Z"),
          keyHash: "cleanup-expired-one",
          scope: expiredScope,
          windowStart: new Date("2026-10-14T11:45:00.000Z"),
        },
        {
          count: 1,
          expiresAt: new Date("2026-10-14T11:59:00.000Z"),
          keyHash: "cleanup-expired-two",
          scope: expiredScope,
          windowStart: new Date("2026-10-14T11:45:00.000Z"),
        },
        {
          count: 1,
          expiresAt: new Date("2026-10-14T12:01:00.000Z"),
          keyHash: "cleanup-fresh",
          scope: freshScope,
          windowStart: new Date("2026-10-14T12:00:00.000Z"),
        },
      ],
    });

    await expect(cleanupExpiredRateLimitBuckets(now)).resolves.toEqual({ deletedCount: 2 });
    await expect(cleanupExpiredRateLimitBuckets(now)).resolves.toEqual({ deletedCount: 0 });
    await expect(prisma.rateLimitBucket.count({ where: { scope: freshScope } })).resolves.toBe(1);
  });
});
