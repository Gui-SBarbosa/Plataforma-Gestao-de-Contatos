import { UserRole } from "@prisma/client";
import { Router } from "express";

import { requireAuthentication, requireCsrf, requireRole } from "../auth/auth.middleware.js";

import { approve, createUser, listPending, reject } from "./admin-users.controller.js";

export const adminUsersRouter = Router();

adminUsersRouter.get("/", requireAuthentication, requireRole(UserRole.ADMIN), listPending);
adminUsersRouter.post("/", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, createUser);
adminUsersRouter.patch("/:id/approve", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, approve);
adminUsersRouter.patch("/:id/reject", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, reject);
