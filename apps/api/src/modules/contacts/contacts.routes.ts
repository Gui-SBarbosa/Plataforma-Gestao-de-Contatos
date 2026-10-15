import { Router } from "express";
import { UserRole } from "@prisma/client";

import { requireAuthentication, requireCsrf, requireRole } from "../auth/auth.middleware.js";

import { create, getById } from "./contacts.controller.js";

export const contactsRouter = Router();

contactsRouter.post("/", requireAuthentication, requireRole(UserRole.ADMIN, UserRole.OPERATOR), requireCsrf, create);
contactsRouter.get("/:id", requireAuthentication, requireRole(UserRole.ADMIN, UserRole.OPERATOR), getById);
