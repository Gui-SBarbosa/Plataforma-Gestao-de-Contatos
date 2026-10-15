import { UserRole } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { CreateContactInput } from "./contacts.schema.js";

const contactSelect = {
  city: true,
  company: true,
  createdAt: true,
  email: true,
  id: true,
  name: true,
  phone: true,
  source: true,
} as const;

export const createContact = (input: CreateContactInput, createdById: string) =>
  prisma.contact.create({
    data: { ...input, createdById },
    select: contactSelect,
  });

export const findVisibleContact = (contactId: string, user: { id: string; role: UserRole }) =>
  prisma.contact.findFirst({
    select: contactSelect,
    where: user.role === UserRole.ADMIN ? { id: contactId } : { createdById: user.id, id: contactId },
  });
