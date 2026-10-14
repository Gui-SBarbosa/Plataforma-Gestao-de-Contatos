import { Router } from "express";

import { requireCsrf } from "../auth/auth.middleware.js";
import { rateLimitRegistration } from "../rate-limit/rate-limit.middleware.js";

import { register } from "./registration.controller.js";

export const registrationRouter = Router();

registrationRouter.post("/register", requireCsrf, rateLimitRegistration, register);
