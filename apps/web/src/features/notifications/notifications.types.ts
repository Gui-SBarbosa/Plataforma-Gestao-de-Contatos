export type NotificationItem = {
  createdAt: string;
  id: string;
  message: string;
  payload: Record<string, unknown> | null;
  readAt: string | null;
  title: string;
  type: "NEW_CONTACT" | "REGISTRATION_APPROVED" | "REGISTRATION_REJECTED" | "REGISTRATION_REQUEST";
};

export type NotificationPage = {
  data: NotificationItem[];
  meta: { page: number; pageSize: number; total: number; totalPages: number; unread: number };
};
