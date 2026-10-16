import { useEffect } from "react";

import { createRealtimeSocket } from "./realtime";

const dispatch = (name: string) => window.dispatchEvent(new Event(name));

export const useRealtimeEvents = (enabled: boolean) => {
  useEffect(() => {
    if (!enabled) return;

    const socket = createRealtimeSocket();
    let disposed = false;
    let recoveryTimer: number | undefined;
    const recoverWhileDisconnected = () => {
      if (disposed || recoveryTimer !== undefined) return;
      dispatch("realtime:recovery");
      recoveryTimer = window.setInterval(() => dispatch("realtime:recovery"), 15000);
    };
    const stopRecovery = () => {
      if (recoveryTimer === undefined) return;
      window.clearInterval(recoveryTimer);
      recoveryTimer = undefined;
    };
    socket.on("contact:created", () => dispatch("realtime:contact-created"));
    socket.on("registration:requested", () => dispatch("realtime:registration-requested"));
    socket.on("connect", () => {
      stopRecovery();
      dispatch("realtime:connected");
    });
    socket.on("connect_error", recoverWhileDisconnected);
    socket.on("disconnect", recoverWhileDisconnected);
    socket.connect();

    return () => {
      disposed = true;
      stopRecovery();
      socket.disconnect();
    };
  }, [enabled]);
};
