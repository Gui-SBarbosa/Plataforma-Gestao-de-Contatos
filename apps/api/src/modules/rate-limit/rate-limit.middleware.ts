import type { RequestHandler } from "express";

import { loginSchema } from "../auth/auth.schema.js";

import { consumeRateLimit, type RateLimitResult } from "./rate-limit.service.js";

const setRateLimitHeaders = (response: Parameters<RequestHandler>[1], result: RateLimitResult) => {
  response.set({
    "RateLimit-Limit": result.limit.toString(),
    "RateLimit-Remaining": result.remaining.toString(),
    "RateLimit-Reset": result.retryAfterSeconds.toString(),
  });
};

const rejectRequest = (response: Parameters<RequestHandler>[1], requestId: string, result: RateLimitResult) => {
  setRateLimitHeaders(response, result);
  response.set("Retry-After", result.retryAfterSeconds.toString());
  response.status(429).json({
    error: { code: "RATE_LIMITED", message: "Unable to process the request.", requestId },
  });
};

export const rateLimitLogin: RequestHandler = async (request, response, next) => {
  const input = loginSchema.safeParse(request.body);
  const identity = input.success ? input.data.email : "invalid-identity";

  try {
    const [ipResult, identityResult] = await Promise.all([
      consumeRateLimit("AUTH_LOGIN_IP", request.ip ?? "unknown-ip"),
      consumeRateLimit("AUTH_LOGIN_IDENTITY", identity),
    ]);
    const blockingResult = [ipResult, identityResult].find((result) => result.exceeded);

    if (blockingResult) {
      rejectRequest(response, String(request.id), blockingResult);
      return;
    }

    setRateLimitHeaders(response, identityResult);
    next();
  } catch {
    response.status(503).json({
      error: { code: "RATE_LIMIT_UNAVAILABLE", message: "Unable to process the request.", requestId: String(request.id) },
    });
  }
};
