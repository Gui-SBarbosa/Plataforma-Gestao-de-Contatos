import { createHmac, timingSafeEqual } from "node:crypto";

import type { RequestHandler } from "express";
import type { UserRole } from "@prisma/client";

import { env } from "../../config/env.js";

import { getActiveUser } from "./auth.service.js";

const unauthorized = (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1]) => {
  response.status(401).json({
    error: {
      code: "UNAUTHENTICATED",
      message: "Authentication is required.",
      requestId: request.id,
    },
  });
};

const destroySession = (request: Parameters<RequestHandler>[0]) =>
  new Promise<void>((resolve) => {
    request.session.destroy(() => resolve());
  });

export const requireAuthentication: RequestHandler = async (request, response, next) => {
  if (!request.session.userId) {
    unauthorized(request, response);
    return;
  }

  try {
    const user = await getActiveUser(request.session.userId);

    if (!user) {
      await destroySession(request);
      unauthorized(request, response);
      return;
    }

    request.authUser = user;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireCsrf: RequestHandler = (request, response, next) => {
  const csrfToken = request.get("x-csrf-token");
  const sessionToken = request.session.csrfToken;

  if (!csrfToken || !sessionToken) {
    response.status(403).json({
      error: {
        code: "CSRF_INVALID",
        message: "The request could not be processed.",
        requestId: request.id,
      },
    });
    return;
  }

  const receivedToken = Buffer.from(csrfToken);
  const expectedToken = Buffer.from(sessionToken);
  const [nonce, signature] = csrfToken.split(".");
  const expectedSignature = nonce
    ? createHmac("sha256", env.CSRF_SECRET).update(`${request.sessionID}.${nonce}`).digest("base64url")
    : "";
  const receivedSignature = Buffer.from(signature ?? "");
  const expectedSignatureBuffer = Buffer.from(expectedSignature);

  if (
    receivedToken.length !== expectedToken.length ||
    !timingSafeEqual(receivedToken, expectedToken) ||
    receivedSignature.length !== expectedSignatureBuffer.length ||
    !timingSafeEqual(receivedSignature, expectedSignatureBuffer)
  ) {
    response.status(403).json({
      error: {
        code: "CSRF_INVALID",
        message: "The request could not be processed.",
        requestId: request.id,
      },
    });
    return;
  }

  next();
};

export const requireRole = (...roles: UserRole[]): RequestHandler => (request, response, next) => {
  if (!request.authUser || !roles.includes(request.authUser.role)) {
    response.status(403).json({
      error: { code: "FORBIDDEN", message: "You do not have permission to perform this action.", requestId: request.id },
    });
    return;
  }

  next();
};
