import type { RequestHandler } from "express";

import { dashboardQuerySchema } from "./dashboard.schema.js";
import { getDashboard } from "./dashboard.service.js";

export const overview: RequestHandler = async (request, response, next) => {
  const input = dashboardQuerySchema.safeParse(request.query);
  if (!input.success) {
    response
      .status(400)
      .json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Unable to process the request.",
          requestId: request.id,
        },
      });
    return;
  }
  try {
    const dashboard = await getDashboard(input.data, request.authUser!);
    if (dashboard === null) {
      response
        .status(403)
        .json({
          error: {
            code: "FORBIDDEN",
            message: "Unable to process the request.",
            requestId: request.id,
          },
        });
      return;
    }
    if (!dashboard) {
      response
        .status(400)
        .json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Unable to process the request.",
            requestId: request.id,
          },
        });
      return;
    }
    response.status(200).json({ data: dashboard });
  } catch (error) {
    next(error);
  }
};
