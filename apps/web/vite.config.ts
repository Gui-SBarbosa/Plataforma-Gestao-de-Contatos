import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, "../..", "");
  const apiProxyTarget = env.VITE_API_PROXY_TARGET ?? "http://localhost:3001";

  return {
    plugins: [react()],
    server: {
      port: Number(env.WEB_PORT ?? 5173),
      proxy: {
        "/api": apiProxyTarget,
        "/socket.io": { target: apiProxyTarget, ws: true },
      },
    },
  };
});
