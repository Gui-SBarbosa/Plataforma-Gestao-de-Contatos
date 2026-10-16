import type { RequestHandler } from "express";

import { RegistrationConflictError, registerOperator } from "./registration.service.js";
import { registrationSchema } from "./registration.schema.js";

export const register: RequestHandler = async (request, response, next) => {
  const input = registrationSchema.safeParse(request.body);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const registration = await registerOperator(input.data);
    const publishRegistrationRequested = request.app.locals.publishRegistrationRequested as
      | ((notification: { createdAt: Date; registrationId: string; requesterName: string }) => void)
      | undefined;
    publishRegistrationRequested?.({
      createdAt: registration.createdAt,
      registrationId: registration.registrationId,
      requesterName: registration.requesterName,
    });

    response.status(202).json({ data: { status: registration.status, trackingToken: registration.trackingToken } });
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      response.status(409).json({
        error: { code: "REGISTRATION_CONFLICT", message: "Unable to process the request.", requestId: request.id },
      });
      return;
    }

    next(error);
  }
};
