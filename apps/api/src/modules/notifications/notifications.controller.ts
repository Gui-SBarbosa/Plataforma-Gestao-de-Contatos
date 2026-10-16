import type { RequestHandler } from "express";

import { listNotificationsSchema, notificationIdSchema } from "./notifications.schema.js";
import { listNotifications, markNotificationRead } from "./notifications.service.js";

export const list: RequestHandler = async (request, response, next) => {
  const input = listNotificationsSchema.safeParse(request.query);

  if (!input.success) {
    response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id } });
    return;
  }

  try {
    const result = await listNotifications(input.data, request.authUser!.id);
    response.status(200).json({
      data: result.notifications,
      meta: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages, unread: result.unread },
    });
  } catch (error) {
    next(error);
  }
};

export const markRead: RequestHandler = async (request, response, next) => {
  const input = notificationIdSchema.safeParse(request.params);

  if (!input.success) {
    response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id } });
    return;
  }

  try {
    const updated = await markNotificationRead(input.data.id, request.authUser!.id);
    if (!updated) {
      response.status(404).json({ error: { code: "NOTIFICATION_NOT_FOUND", message: "Unable to process the request.", requestId: request.id } });
      return;
    }
    response.status(204).end();
  } catch (error) {
    next(error);
  }
};
