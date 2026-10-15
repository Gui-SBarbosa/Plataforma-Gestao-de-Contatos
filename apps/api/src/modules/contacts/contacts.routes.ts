import { Router } from "express";

import { requireAuthentication, requireCsrf } from "../auth/auth.middleware.js";

import { create } from "./contacts.controller.js";

export const contactsRouter = Router();

contactsRouter.post("/", requireAuthentication, requireCsrf, create);
