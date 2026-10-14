import cors from "cors";
import express from "express";
import { pinoHttp } from "pino-http";

import { errorHandler } from "./middlewares/error-handler.js";
import { notFoundHandler } from "./middlewares/not-found.js";
import { requestId } from "./middlewares/request-id.js";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.use(requestId);
  app.use(pinoHttp({ genReqId: (request) => request.id }));
  app.use(cors());
  app.use(express.json({ limit: "16kb" }));

  app.get("/api/health", (_request, response) => {
    response.status(200).json({
      data: {
        status: "ok",
      },
    });
  });

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
