export const rateLimitPolicies = {
  AUTH_LOGIN_IDENTITY: { limit: 5, windowMs: 15 * 60 * 1000 },
  AUTH_LOGIN_IP: { limit: 20, windowMs: 15 * 60 * 1000 },
  AUTH_REGISTER_IP: { limit: 5, windowMs: 60 * 60 * 1000 },
  REGISTRATION_STATUS: { limit: 60, windowMs: 60 * 1000 },
} as const;

export type RateLimitScope = keyof typeof rateLimitPolicies;
