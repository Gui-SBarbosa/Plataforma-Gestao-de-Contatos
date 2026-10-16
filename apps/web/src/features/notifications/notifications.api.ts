import { getCsrfToken, request } from "../../services/http";

import type { NotificationPage } from "./notifications.types";

export const listNotifications = (page = 1, pageSize = 5) => request<NotificationPage>(`/api/notifications?page=${page}&pageSize=${pageSize}`);

export const markNotificationRead = async (notificationId: string) => {
  const csrfToken = await getCsrfToken();
  await request<void>(`/api/notifications/${notificationId}/read`, {
    headers: { "X-CSRF-Token": csrfToken },
    method: "PATCH",
  });
};

export const markAllNotificationsRead = async () => {
  const csrfToken = await getCsrfToken();
  await request<void>("/api/notifications/read-all", {
    headers: { "X-CSRF-Token": csrfToken },
    method: "PATCH",
  });
};
