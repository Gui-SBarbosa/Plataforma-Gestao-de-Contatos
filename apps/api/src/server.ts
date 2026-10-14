import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startRateLimitCleanupSchedule } from "./modules/rate-limit/rate-limit.cleanup.js";
import { createRegistrationRealtime } from "./realtime/registration-realtime.js";

const app = createApp();
const httpServer = createServer(app);
const realtime = createRegistrationRealtime(httpServer);

app.locals.publishRegistrationDecision = realtime.publishRegistrationDecision;

httpServer.listen(env.API_PORT, () => {
  console.info(`API listening on port ${env.API_PORT}`);
});

startRateLimitCleanupSchedule();
