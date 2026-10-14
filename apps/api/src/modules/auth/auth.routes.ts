import { Router } from "express";

import { getCurrentUser, issueCsrfToken, login, logout } from "./auth.controller.js";
import { requireAuthentication, requireCsrf } from "./auth.middleware.js";

export const authRouter = Router();

authRouter.get("/csrf", issueCsrfToken);
authRouter.post("/login", requireCsrf, login);
authRouter.post("/logout", requireAuthentication, requireCsrf, logout);
authRouter.get("/me", requireAuthentication, getCurrentUser);
