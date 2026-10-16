import { createHash, randomBytes } from "node:crypto";

import { hash } from "@node-rs/argon2";
import { Prisma, UserRole, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { RegistrationInput } from "./registration.schema.js";

export class RegistrationConflictError extends Error {}

const createTrackingToken = () => randomBytes(32).toString("base64url");

const hashTrackingToken = (trackingToken: string) => createHash("sha256").update(trackingToken).digest("hex");

export const registerOperator = async ({ email, name, password }: RegistrationInput) => {
  const [passwordHash, trackingToken] = await Promise.all([
    hash(password, { algorithm: 2 }),
    Promise.resolve(createTrackingToken()),
  ]);

  let registration: { createdAt: Date; id: string; name: string };
  try {
    registration = await prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          email,
          name,
          passwordHash,
          registrationTokenHash: hashTrackingToken(trackingToken),
          role: UserRole.OPERATOR,
          status: UserStatus.PENDING,
        },
        select: { createdAt: true, id: true, name: true },
      });
      const administrators = await transaction.user.findMany({
        select: { id: true },
        where: { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
      });

      await Promise.all([
        transaction.notification.createMany({
          data: administrators.map((administrator) => ({
            message: `${user.name} solicitou cadastro como operador.`,
            payload: { requesterName: user.name, registrationId: user.id, createdAt: user.createdAt.toISOString() },
            recipientId: administrator.id,
            title: "Nova solicitação de cadastro",
            type: "REGISTRATION_REQUEST" as const,
          })),
        }),
        transaction.auditLog.create({
          data: { action: "REGISTRATION_REQUESTED", actorId: user.id, entityId: user.id, entityType: "USER" },
        }),
      ]);

      return user;
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new RegistrationConflictError();
    }

    throw error;
  }

  return { createdAt: registration.createdAt, registrationId: registration.id, requesterName: registration.name, status: UserStatus.PENDING, trackingToken };
};

export const findRegistrationByTrackingToken = (trackingToken: string) =>
  prisma.user.findUnique({
    select: { approvedAt: true, id: true, status: true, updatedAt: true },
    where: { registrationTokenHash: hashTrackingToken(trackingToken) },
  });
