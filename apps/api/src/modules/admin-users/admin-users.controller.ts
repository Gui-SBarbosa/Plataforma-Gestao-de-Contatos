import type { RequestHandler } from "express";

import { createAdminOperatorSchema, listOperatorsSchema, listPendingUsersSchema, updateOperatorSchema, userIdSchema } from "./admin-users.schema.js";
import {
  AdminUserConflictError,
  PendingUserNotFoundError,
  UserDecisionConflictError,
  OperatorConflictError,
  OperatorNotFoundError,
  approvePendingUser,
  createActiveOperator,
  listPendingUsers,
  rejectPendingUser,
  listOperators,
  setOperatorStatus,
  updateOperator,
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

export const listAllOperators: RequestHandler = async (request, response, next) => {
  const input = listOperatorsSchema.safeParse(request.query);
  if (!input.success) { response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id } }); return; }
  try { const result = await listOperators(input.data); response.status(200).json({ data: result.users, meta: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages } }); } catch (error) { next(error); }
};

export const update: RequestHandler = async (request, response, next) => {
  const params = userIdSchema.safeParse(request.params); const input = updateOperatorSchema.safeParse(request.body);
  if (!params.success || !input.success) { response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id } }); return; }
  try { response.status(200).json({ data: { user: await updateOperator(params.data.id, input.data) } }); } catch (error) {
    if (error instanceof OperatorNotFoundError) { response.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Unable to process the request.", requestId: request.id } }); return; }
    if (error instanceof OperatorConflictError) { response.status(409).json({ error: { code: "USER_CONFLICT", message: "Unable to process the request.", requestId: request.id } }); return; }
    next(error);
  }
};

export const deactivate: RequestHandler = async (request, response, next) => changeStatus(request, response, next, "DISABLED");
export const activate: RequestHandler = async (request, response, next) => changeStatus(request, response, next, "ACTIVE");

const changeStatus = async (request: Parameters<RequestHandler>[0], response: Parameters<RequestHandler>[1], next: Parameters<RequestHandler>[2], status: "ACTIVE" | "DISABLED") => {
  const params = userIdSchema.safeParse(request.params);
  if (!params.success) { response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id } }); return; }
  try { response.status(200).json({ data: { user: await setOperatorStatus(params.data.id, status) } }); } catch (error) {
    if (error instanceof OperatorNotFoundError) { response.status(404).json({ error: { code: "USER_NOT_FOUND", message: "Unable to process the request.", requestId: request.id } }); return; }
    if (error instanceof OperatorConflictError) { response.status(409).json({ error: { code: "INVALID_USER_TRANSITION", message: "Unable to process the request.", requestId: request.id } }); return; }
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
      const decisionResult = await decision(input.data.id, request.authUser!.id);
      const { approvedAt, updatedAt, ...user } = decisionResult;
      const publishRegistrationDecision = request.app.locals.publishRegistrationDecision as
        | ((decision: { decidedAt: Date; registrationId: string; status: "ACTIVE" | "REJECTED" }) => void)
        | undefined;

      if (user.status === "ACTIVE" || user.status === "REJECTED") {
        publishRegistrationDecision?.({
          decidedAt: approvedAt ?? updatedAt,
          registrationId: user.id,
          status: user.status,
        });
      }

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
