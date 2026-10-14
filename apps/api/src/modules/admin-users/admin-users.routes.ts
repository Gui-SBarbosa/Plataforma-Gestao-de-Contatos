import { UserRole } from "@prisma/client";
import { Router } from "express";

import { requireAuthentication, requireCsrf, requireRole } from "../auth/auth.middleware.js";

import { createUser } from "./admin-users.controller.js";

export const adminUsersRouter = Router();

adminUsersRouter.post("/", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, createUser);
