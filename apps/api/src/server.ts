import { createServer } from "node:http";

import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { startRateLimitCleanupSchedule } from "./modules/rate-limit/rate-limit.cleanup.js";
import { createRegistrationRealtime } from "./realtime/registration-realtime.js";

const app = createApp();
const httpServer = createServer(app);
const realtime = createRegistrationRealtime(httpServer, app.locals.sessionMiddleware);

app.locals.publishRegistrationDecision = realtime.publishRegistrationDecision;
app.locals.publishContactCreated = realtime.publishContactCreated;
app.locals.publishRegistrationRequested = realtime.publishRegistrationRequested;

const port = env.PORT ?? env.API_PORT;

httpServer.listen(port, () => {
  console.info(`API listening on port ${port}`);
});

startRateLimitCleanupSchedule();
