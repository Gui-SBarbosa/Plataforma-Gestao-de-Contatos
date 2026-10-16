import { useEffect } from "react";

import { createRealtimeSocket } from "./realtime";

const dispatch = (name: string) => window.dispatchEvent(new Event(name));

export const useRealtimeEvents = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const socket = createRealtimeSocket();
    socket.on("contact:created", () => dispatch("realtime:contact-created"));
    socket.on("registration:requested", () => dispatch("realtime:registration-requested"));
    socket.on("connect", () => dispatch("realtime:connected"));
    socket.connect();
    const recoveryTimer = window.setInterval(() => dispatch("realtime:recovery"), 15000);

    return () => {
      window.clearInterval(recoveryTimer);
      socket.disconnect();
    };
  }, [enabled]);
};
