import { Router } from "express";

import { requireAuthentication } from "../auth/auth.middleware.js";

import { overview } from "./dashboard.controller.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", requireAuthentication, overview);
