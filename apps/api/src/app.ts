import cors from "cors";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/env.js";
import { PrismaSessionStore } from "./config/session-store.js";
import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { requestId } from "./middlewares/request-id.js";
import { authRouter } from "./modules/auth/auth.routes.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.use(requestId);
  app.use(
    pinoHttp({
      genReqId: (request) => request.id,
      redact: ["req.headers.cookie", "req.headers.x-csrf-token", "res.headers.set-cookie"],
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
  app.use(
    session({
      cookie: {
        httpOnly: true,
        maxAge: 8 * 60 * 60 * 1000,
        sameSite: "lax",
        secure: env.NODE_ENV === "production",
      },
      name: "gestcon.sid",
      resave: false,
      saveUninitialized: false,
      secret: env.SESSION_SECRET,
      store: new PrismaSessionStore(),
    }),
  );

  app.get("/api/health", (_request, response) => {
    response.status(200).json({
      data: {
        status: "ok",
      },
    });
  });

  app.use("/api/auth", authRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
