import { createHmac } from "node:crypto";

import { env } from "../../config/env.js";
import { prisma } from "../../config/prisma.js";

import { rateLimitPolicies, type RateLimitScope } from "./rate-limit.policy.js";

export type RateLimitResult = {
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  exceeded: boolean;
};

const hashKey = (key: string) => createHmac("sha256", env.RATE_LIMIT_SECRET).update(key).digest("hex");

const getWindow = (windowMs: number, now: Date) => {
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);

  return { expiresAt: new Date(windowStart.getTime() + windowMs), windowStart };
};

export const consumeRateLimit = async (scope: RateLimitScope, key: string, now = new Date()): Promise<RateLimitResult> => {
  const policy = rateLimitPolicies[scope];
  const { expiresAt, windowStart } = getWindow(policy.windowMs, now);
  const keyHash = hashKey(key);
  const bucket = await prisma.rateLimitBucket.upsert({
    create: { count: 1, expiresAt, keyHash, scope, windowStart },
    update: { count: { increment: 1 } },
    where: { scope_keyHash_windowStart: { keyHash, scope, windowStart } },
  });
  const retryAfterSeconds = Math.max(1, Math.ceil((expiresAt.getTime() - now.getTime()) / 1000));

  return {
    exceeded: bucket.count > policy.limit,
    limit: policy.limit,
    remaining: Math.max(0, policy.limit - bucket.count),
    retryAfterSeconds,
  };
};

export const clearRateLimit = async (scope: RateLimitScope, key: string): Promise<void> => {
  await prisma.rateLimitBucket.deleteMany({ where: { keyHash: hashKey(key), scope } });
};
