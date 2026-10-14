import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startRateLimitCleanupSchedule } from "./modules/rate-limit/rate-limit.cleanup.js";

const app = createApp();

app.listen(env.API_PORT, () => {
  console.info(`API listening on port ${env.API_PORT}`);
});

startRateLimitCleanupSchedule();
