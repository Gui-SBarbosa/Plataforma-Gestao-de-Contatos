import { prisma } from "../config/prisma.js";
import { cleanupExpiredRateLimitBuckets } from "../modules/rate-limit/rate-limit.cleanup.js";

try {
  const { deletedCount } = await cleanupExpiredRateLimitBuckets();
  console.info(`Rate limit cleanup completed: ${deletedCount} expired buckets removed.`);
} catch {
  console.error("Rate limit cleanup failed.");
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
