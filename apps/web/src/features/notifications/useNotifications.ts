import { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";

import { listNotifications, markNotificationRead } from "./notifications.api";
import type { NotificationItem } from "./notifications.types";

type NotificationState = { items: NotificationItem[]; isLoading: boolean; unread: number };

const initialState: NotificationState = { isLoading: false, items: [], unread: 0 };

export const useNotifications = (enabled: boolean) => {
  const [state, setState] = useState<NotificationState>(initialState);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setState((current) => ({ ...current, isLoading: true }));
    try {
      const page = await listNotifications();
      setState({ isLoading: false, items: page.data, unread: page.meta.unread });
    } catch {
      setState((current) => ({ ...current, isLoading: false }));
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setState(initialState);
      return;
    }

    const socket = io({ autoConnect: false, transports: ["websocket"] });
    socket.on("contact:created", () => { void refresh(); });
    socket.connect();
    void refresh();

    return () => {
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

  return { ...state, markRead, refresh };
};
