import { UserRole } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { CreateContactInput, ListContactsInput } from "./contacts.schema.js";

const contactSelect = {
  city: true,
  company: true,
  createdAt: true,
  email: true,
  id: true,
  name: true,
  phone: true,
  source: true,
  createdBy: { select: { name: true } },
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

export const listVisibleContacts = async ({ page, pageSize }: ListContactsInput, user: { id: string; role: UserRole }) => {
  const where = user.role === UserRole.ADMIN ? {} : { createdById: user.id };
  const [total, contacts] = await prisma.$transaction([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: contactSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
    }),
  ]);

  return { contacts, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
};
