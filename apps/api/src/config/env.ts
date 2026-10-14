import { config } from "dotenv";
import { fileURLToPath } from "node:url";

import { z } from "zod";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

const environmentSchema = z.object({
  API_PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ORIGIN: z.string().url().default("http://localhost:5173"),
  CSRF_SECRET: z.string().min(32),
  SESSION_SECRET: z.string().min(32),
});

export const env = environmentSchema.parse(process.env);
