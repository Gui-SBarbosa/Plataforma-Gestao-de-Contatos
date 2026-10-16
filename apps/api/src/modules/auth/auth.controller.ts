import { createHmac, randomBytes } from "node:crypto";

import type { RequestHandler } from "express";

import { env } from "../../config/env.js";
import { clearRateLimit } from "../rate-limit/rate-limit.service.js";
import { recordAuditEvent } from "../audit/audit.service.js";

import { loginSchema } from "./auth.schema.js";
import { authenticateUser } from "./auth.service.js";

const createCsrfToken = (sessionId: string) =>
  (() => {
    const nonce = randomBytes(32).toString("base64url");
    const signature = createHmac("sha256", env.CSRF_SECRET).update(`${sessionId}.${nonce}`).digest("base64url");

    return `${nonce}.${signature}`;
  })();

const saveSession = (request: Parameters<RequestHandler>[0]) =>
  new Promise<void>((resolve, reject) => {
    request.session.save((error) => (error ? reject(error) : resolve()));
  });

const regenerateSession = (request: Parameters<RequestHandler>[0]) =>
  new Promise<void>((resolve, reject) => {
    request.session.regenerate((error) => (error ? reject(error) : resolve()));
  });

export const issueCsrfToken: RequestHandler = async (request, response, next) => {
  try {
    if (!request.session.csrfToken) {
      request.session.csrfToken = createCsrfToken(request.sessionID);
      await saveSession(request);
    }

    response.status(200).json({ data: { csrfToken: request.session.csrfToken } });
  } catch (error) {
    next(error);
  }
};

export const login: RequestHandler = async (request, response, next) => {
  const input = loginSchema.safeParse(request.body);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const user = await authenticateUser(input.data);

    if (!user) {
      await recordAuditEvent({ action: "AUTH_LOGIN_FAILED", entityType: "AUTH" });
      response.status(401).json({
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password.", requestId: request.id },
      });
      return;
    }

    try {
      await clearRateLimit("AUTH_LOGIN_IDENTITY", input.data.email);
    } catch {
      response.status(503).json({
        error: { code: "RATE_LIMIT_UNAVAILABLE", message: "Unable to process the request.", requestId: request.id },
      });
      return;
    }
    await regenerateSession(request);
    request.session.userId = user.id;
    request.session.csrfToken = createCsrfToken(request.sessionID);
    await saveSession(request);
    await recordAuditEvent({ action: "AUTH_LOGIN_SUCCEEDED", actorId: user.id, entityId: user.id, entityType: "AUTH" });

    response.status(200).json({ data: { user, csrfToken: request.session.csrfToken } });
  } catch (error) {
    next(error);
  }
};

export const logout: RequestHandler = async (request, response, next) => {
  const actorId = request.authUser!.id;
  try {
    await new Promise<void>((resolve, reject) => request.session.destroy((error) => (error ? reject(error) : resolve())));
    await recordAuditEvent({ action: "AUTH_LOGOUT", actorId, entityId: actorId, entityType: "AUTH" });
    response.clearCookie("gestcon.sid");
    response.status(204).send();
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser: RequestHandler = (request, response) => {
  response.status(200).json({ data: { user: request.authUser } });
};
