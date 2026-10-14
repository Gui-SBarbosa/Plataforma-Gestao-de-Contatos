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

  try {
    await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        registrationTokenHash: hashTrackingToken(trackingToken),
        role: UserRole.OPERATOR,
        status: UserStatus.PENDING,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new RegistrationConflictError();
    }

    throw error;
  }

  return { status: UserStatus.PENDING, trackingToken };
};
