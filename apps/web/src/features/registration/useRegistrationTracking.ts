import { useEffect, useState } from "react";
import { io } from "socket.io-client";

import { getRegistrationStatus } from "./registration.api";
import type { RegistrationStatusData } from "./registration.types";

type TrackingState = {
  error: string | null;
  isConnected: boolean;
  isLoading: boolean;
  registration: RegistrationStatusData | null;
};

const initialState: TrackingState = { error: null, isConnected: false, isLoading: false, registration: null };

export const useRegistrationTracking = (trackingToken: string | null) => {
  const [state, setState] = useState<TrackingState>(initialState);

  useEffect(() => {
    if (!trackingToken) {
      setState(initialState);
      return;
    }

    const abortController = new AbortController();
    const socket = io({ autoConnect: false, transports: ["websocket"] });

    const load = async () => {
      setState({ error: null, isConnected: false, isLoading: true, registration: null });

      try {
        const registration = await getRegistrationStatus(trackingToken);

        if (abortController.signal.aborted) return;

        setState({ error: null, isConnected: false, isLoading: false, registration });
        socket.connect();
      } catch {
        if (!abortController.signal.aborted) {
          setState({ error: "Não foi possível consultar esta solicitação.", isConnected: false, isLoading: false, registration: null });
        }
      }
    };

    socket.on("connect", () => {
      socket.emit("registration:watch", { trackingToken }, (result: { data?: RegistrationStatusData; ok: boolean }) => {
        if (!result.ok || abortController.signal.aborted) {
          setState((current) => ({ ...current, error: "Não foi possível acompanhar esta solicitação em tempo real." }));
          return;
        }

        setState({ error: null, isConnected: true, isLoading: false, registration: result.data ?? null });
      });
    });

    socket.on("connect_error", () => {
      if (!abortController.signal.aborted) setState((current) => ({ ...current, isConnected: false }));
    });

    const updateRegistration = (registration: RegistrationStatusData) => {
      if (!abortController.signal.aborted) setState({ error: null, isConnected: true, isLoading: false, registration });
    };

    socket.on("registration:approved", updateRegistration);
    socket.on("registration:rejected", updateRegistration);
    void load();

    return () => {
      abortController.abort();
      socket.emit("registration:unwatch");
      socket.disconnect();
    };
  }, [trackingToken]);

  return state;
};
