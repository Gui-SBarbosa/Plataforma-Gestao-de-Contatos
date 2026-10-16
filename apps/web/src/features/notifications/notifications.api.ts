import { getCsrfToken, request } from "../../services/http";

import type { NotificationPage } from "./notifications.types";

export const listNotifications = (page = 1) => request<NotificationPage>(`/api/notifications?page=${page}&pageSize=5`);

export const markNotificationRead = async (notificationId: string) => {
  const csrfToken = await getCsrfToken();
  await request<void>(`/api/notifications/${notificationId}/read`, {
    headers: { "X-CSRF-Token": csrfToken },
    method: "PATCH",
  });
};
