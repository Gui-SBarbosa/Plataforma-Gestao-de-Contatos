import { Router } from "express";

import { getCurrentUser, issueCsrfToken, login, logout } from "./auth.controller.js";
import { requireAuthentication, requireCsrf } from "./auth.middleware.js";
import { rateLimitLogin } from "../rate-limit/rate-limit.middleware.js";

export const authRouter = Router();

authRouter.get("/csrf", issueCsrfToken);
authRouter.post("/login", requireCsrf, rateLimitLogin, login);
authRouter.post("/logout", requireAuthentication, requireCsrf, logout);
authRouter.get("/me", requireAuthentication, getCurrentUser);
