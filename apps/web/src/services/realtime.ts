import { io } from "socket.io-client";

/**
 * Socket.IO starts with polling and upgrades to WebSocket when the platform
 * supports it. This keeps realtime working behind proxies that do not accept
 * an immediate WebSocket handshake (for example during a Railway restart).
 */
export const createRealtimeSocket = () => io({
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
  transports: ["polling", "websocket"],
});
