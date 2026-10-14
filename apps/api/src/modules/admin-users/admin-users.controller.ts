import type { RequestHandler } from "express";

import { createAdminOperatorSchema } from "./admin-users.schema.js";
import { AdminUserConflictError, createActiveOperator } from "./admin-users.service.js";

export const createUser: RequestHandler = async (request, response, next) => {
  const input = createAdminOperatorSchema.safeParse(request.body);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const user = await createActiveOperator(input.data);

    response.status(201).json({ data: { user } });
  } catch (error) {
    if (error instanceof AdminUserConflictError) {
      response.status(409).json({
        error: { code: "USER_CONFLICT", message: "Unable to process the request.", requestId: request.id },
      });
      return;
    }

    next(error);
  }
};
