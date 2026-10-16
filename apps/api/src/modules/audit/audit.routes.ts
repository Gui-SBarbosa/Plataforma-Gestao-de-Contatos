import { UserRole } from "@prisma/client";
import { Router } from "express";

import { requireAuthentication, requireRole } from "../auth/auth.middleware.js";

import { list } from "./audit.controller.js";

export const auditRouter = Router();

auditRouter.get("/", requireAuthentication, requireRole(UserRole.ADMIN), list);
