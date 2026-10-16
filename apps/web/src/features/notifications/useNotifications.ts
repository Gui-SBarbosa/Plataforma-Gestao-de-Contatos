import { useCallback, useEffect, useState } from "react";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "./notifications.api";
import type { NotificationItem } from "./notifications.types";
import { createRealtimeSocket } from "../../services/realtime";

type NotificationState = { items: NotificationItem[]; isLoading: boolean; unread: number };

const initialState: NotificationState = { isLoading: false, items: [], unread: 0 };

export const useNotifications = (enabled: boolean, pageSize = 5) => {
  const [state, setState] = useState<NotificationState>(initialState);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setState((current) => ({ ...current, isLoading: true }));
    try {
      const page = await listNotifications(1, pageSize);
      setState({ isLoading: false, items: page.data, unread: page.meta.unread });
    } catch {
      setState((current) => ({ ...current, isLoading: false }));
    }
  }, [enabled, pageSize]);

  useEffect(() => {
    if (!enabled) {
      setState(initialState);
      return;
    }

    const socket = createRealtimeSocket();
    socket.on("contact:created", () => { void refresh(); });
    socket.on("registration:requested", () => {
      void refresh();
      window.dispatchEvent(new Event("registration:requested"));
    });
    socket.on("connect", () => { void refresh(); });
    const handleNotificationsChanged = () => { void refresh(); };
    window.addEventListener("notifications:changed", handleNotificationsChanged);
    socket.connect();
    void refresh();
    const recoveryTimer = window.setInterval(() => { void refresh(); }, 15000);

    return () => {
      window.removeEventListener("notifications:changed", handleNotificationsChanged);
      window.clearInterval(recoveryTimer);
      socket.disconnect();
    };
  }, [enabled, refresh]);

  const markRead = useCallback(async (notificationId: string) => {
    const notification = state.items.find((item) => item.id === notificationId);
    if (!notification || notification.readAt) return;
    await markNotificationRead(notificationId);
    setState((current) => ({
      ...current,
      items: current.items.map((item) => item.id === notificationId ? { ...item, readAt: new Date().toISOString() } : item),
      unread: Math.max(0, current.unread - 1),
    }));
  }, [state.items]);

  const markAllRead = useCallback(async () => {
    if (!state.unread) return;
    await markAllNotificationsRead();
    setState((current) => ({
      ...current,
      items: current.items.map((item) => item.readAt ? item : { ...item, readAt: new Date().toISOString() }),
      unread: 0,
    }));
  }, [state.unread]);

  return { ...state, markAllRead, markRead, refresh };
};
