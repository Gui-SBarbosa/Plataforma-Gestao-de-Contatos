import { Router } from "express";

import { requireAuthentication, requireCsrf } from "../auth/auth.middleware.js";

import { list, markRead } from "./notifications.controller.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuthentication, list);
notificationsRouter.patch("/:id/read", requireAuthentication, requireCsrf, markRead);
