import { NotificationType, UserRole, UserStatus } from "@prisma/client";

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

export const createContact = (input: CreateContactInput, createdById: string, creatorName: string) =>
  prisma.$transaction(async (transaction) => {
    const contact = await transaction.contact.create({
      data: { ...input, createdById },
      select: contactSelect,
    });
    const administrators = await transaction.user.findMany({
      select: { id: true },
      where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
    });

    await Promise.all([
      transaction.notification.createMany({
        data: administrators.map((administrator) => ({
          message: `${creatorName} cadastrou ${contact.name}.`,
          payload: { contactId: contact.id, creatorName, createdAt: contact.createdAt.toISOString() },
          recipientId: administrator.id,
          title: "Novo contato cadastrado",
          type: NotificationType.NEW_CONTACT,
        })),
      }),
      transaction.auditLog.create({
        data: {
          action: "CONTACT_CREATED",
          actorId: createdById,
          entityId: contact.id,
          entityType: "CONTACT",
          metadata: { source: contact.source },
        },
      }),
    ]);

    return contact;
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
