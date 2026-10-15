import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { registerOpenApiDocs } from "./config/openapi.js";
import { registerProductionWeb } from "./config/production-web.js";
import { createSessionMiddleware } from "./config/session.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { requestId } from "./middlewares/request-id.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { adminUsersRouter } from "./modules/admin-users/admin-users.routes.js";
import { contactsRouter } from "./modules/contacts/contacts.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.use(requestId);
  app.use(
    pinoHttp({
      customProps: (request) => ({ route: request.url?.split("?")[0] }),
      genReqId: (request) => request.id,
      redact: ["req.headers.cookie", "req.headers.x-csrf-token", "req.query.trackingToken", "req.url", "res.headers.set-cookie"],
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin: env.APP_ORIGIN,
    }),
  );
  app.use(express.json({ limit: "16kb" }));
  const sessionMiddleware = createSessionMiddleware();
  app.locals.sessionMiddleware = sessionMiddleware;
  app.use(sessionMiddleware);

  app.get("/api/health", (_request, response) => {
    response.status(200).json({
      data: {
        status: "ok",
      },
    });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/admin/users", adminUsersRouter);
  app.use("/api/contacts", contactsRouter);
  app.use("/api/dashboard", dashboardRouter);
  registerOpenApiDocs(app, env.NODE_ENV);
  app.use("/api", notFoundHandler);

  if (env.NODE_ENV === "production") {
    registerProductionWeb(app);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
