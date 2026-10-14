import { randomUUID } from "node:crypto";

import type { RequestHandler } from "express";

export const requestId: RequestHandler = (request, response, next) => {
  const id = randomUUID();

  request.id = id;
  response.setHeader("X-Request-Id", id);
  next();
};
