import type { RequestHandler } from "express";

import { registrationTrackingSchema } from "./registration.schema.js";
import { findRegistrationByTrackingToken } from "./registration.service.js";

export const getRegistrationStatus: RequestHandler = async (request, response, next) => {
  const input = registrationTrackingSchema.safeParse(request.query);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const registration = await findRegistrationByTrackingToken(input.data.trackingToken);

    if (!registration) {
      response.status(404).json({
        error: { code: "REGISTRATION_NOT_FOUND", message: "Unable to process the request.", requestId: request.id },
      });
      return;
    }

    response.status(200).json({
      data: {
        decidedAt: registration.approvedAt ?? (registration.status === "PENDING" ? null : registration.updatedAt),
        status: registration.status,
      },
    });
  } catch (error) {
    next(error);
  }
};
