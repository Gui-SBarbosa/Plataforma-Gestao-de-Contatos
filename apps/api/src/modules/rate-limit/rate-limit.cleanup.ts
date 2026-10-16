import { prisma } from "../../config/prisma.js";

const cleanupIntervalMs = 15 * 60 * 1000;

export const cleanupExpiredRateLimitBuckets = async (now = new Date()) => {
  const result = await prisma.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } });

  return { deletedCount: result.count };
};

const runCleanupSafely = async () => {
  try {
    const { deletedCount } = await cleanupExpiredRateLimitBuckets();
    console.info(`Rate limit cleanup completed: ${deletedCount} expired buckets removed.`);
  } catch {
    console.error("Rate limit cleanup failed.");
  }
};

export const startRateLimitCleanupSchedule = () => {
  void runCleanupSafely();

  const timer = setInterval(() => {
    void runCleanupSafely();
  }, cleanupIntervalMs);
  timer.unref();

  return () => clearInterval(timer);
};
