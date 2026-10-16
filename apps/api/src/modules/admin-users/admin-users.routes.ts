import { UserRole } from "@prisma/client";
import { Router } from "express";

import { requireAuthentication, requireCsrf, requireRole } from "../auth/auth.middleware.js";

import { activate, approve, createUser, deactivate, listAllOperators, listPending, reject, update } from "./admin-users.controller.js";

export const adminUsersRouter = Router();

adminUsersRouter.get("/", requireAuthentication, requireRole(UserRole.ADMIN), listPending);
adminUsersRouter.get("/operators", requireAuthentication, requireRole(UserRole.ADMIN), listAllOperators);
adminUsersRouter.post("/", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, createUser);
adminUsersRouter.patch("/:id", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, update);
adminUsersRouter.delete("/:id", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, deactivate);
adminUsersRouter.patch("/:id/activate", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, activate);
adminUsersRouter.patch("/:id/approve", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, approve);
adminUsersRouter.patch("/:id/reject", requireAuthentication, requireRole(UserRole.ADMIN), requireCsrf, reject);
