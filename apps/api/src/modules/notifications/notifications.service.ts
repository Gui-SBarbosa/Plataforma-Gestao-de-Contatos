import { prisma } from "../../config/prisma.js";

import type { ListNotificationsInput } from "./notifications.schema.js";

const notificationSelect = {
  createdAt: true,
  id: true,
  message: true,
  payload: true,
  readAt: true,
  title: true,
  type: true,
} as const;

export const listNotifications = async ({ page, pageSize }: ListNotificationsInput, recipientId: string) => {
  const where = { recipientId };
  const [total, unread, notifications] = await prisma.$transaction([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
    prisma.notification.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: notificationSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
    }),
  ]);

  return { notifications, page, pageSize, total, totalPages: Math.ceil(total / pageSize), unread };
};

export const markNotificationRead = async (notificationId: string, recipientId: string) => {
  const result = await prisma.notification.updateMany({
    data: { readAt: new Date() },
    where: { id: notificationId, readAt: null, recipientId },
  });

  return result.count > 0;
};
