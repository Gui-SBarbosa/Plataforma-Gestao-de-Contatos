import { Router } from "express";

import { requireCsrf } from "../auth/auth.middleware.js";
import { rateLimitRegistration, rateLimitRegistrationStatus } from "../rate-limit/rate-limit.middleware.js";

import { register } from "./registration.controller.js";
import { getRegistrationStatus } from "./registration-status.controller.js";

export const registrationRouter = Router();

registrationRouter.post("/register", requireCsrf, rateLimitRegistration, register);
registrationRouter.get("/registration-status", rateLimitRegistrationStatus, getRegistrationStatus);
