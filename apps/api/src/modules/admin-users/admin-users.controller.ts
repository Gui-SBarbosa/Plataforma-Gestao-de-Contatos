import type { RequestHandler } from "express";

import { createAdminOperatorSchema, listPendingUsersSchema, userIdSchema } from "./admin-users.schema.js";
import {
  AdminUserConflictError,
  PendingUserNotFoundError,
  UserDecisionConflictError,
  approvePendingUser,
  createActiveOperator,
  listPendingUsers,
  rejectPendingUser,
} from "./admin-users.service.js";

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

export const listPending: RequestHandler = async (request, response, next) => {
  const input = listPendingUsersSchema.safeParse(request.query);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const result = await listPendingUsers(input.data);

    response.status(200).json({
      data: result.users,
      meta: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages },
    });
  } catch (error) {
    next(error);
  }
};

const decide =
  (decision: typeof approvePendingUser): RequestHandler =>
  async (request, response, next) => {
    const input = userIdSchema.safeParse(request.params);

    if (!input.success) {
      response.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
      });
      return;
    }

    try {
      const user = await decision(input.data.id, request.authUser!.id);

      response.status(200).json({ data: { user } });
    } catch (error) {
      if (error instanceof PendingUserNotFoundError) {
        response.status(404).json({
          error: { code: "USER_NOT_FOUND", message: "Unable to process the request.", requestId: request.id },
        });
        return;
      }

      if (error instanceof UserDecisionConflictError) {
        response.status(409).json({
          error: { code: "INVALID_USER_TRANSITION", message: "Unable to process the request.", requestId: request.id },
        });
        return;
      }

      next(error);
    }
  };

export const approve = decide(approvePendingUser);
export const reject = decide(rejectPendingUser);
