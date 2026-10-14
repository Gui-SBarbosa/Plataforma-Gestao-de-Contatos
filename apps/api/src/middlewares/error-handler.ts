import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;
  request.log.error({ err: error, requestId: request.id }, "Unhandled request error");

  response.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "Unable to process the request.",
      requestId: request.id,
    },
  });
};
