import type { RequestHandler } from "express";

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: {
      code: "NOT_FOUND",
      message: "Resource not found.",
      requestId: request.id,
    },
  });
};
