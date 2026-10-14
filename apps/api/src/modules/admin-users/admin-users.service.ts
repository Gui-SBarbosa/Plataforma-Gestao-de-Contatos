import { hash } from "@node-rs/argon2";
import { Prisma, UserRole, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { CreateAdminOperatorInput } from "./admin-users.schema.js";

export class AdminUserConflictError extends Error {}

const adminUserSelect = {
  email: true,
  id: true,
  name: true,
  role: true,
  status: true,
} as const;

export const createActiveOperator = async ({ email, name, password }: CreateAdminOperatorInput) => {
  const passwordHash = await hash(password, { algorithm: 2 });

  try {
    return await prisma.user.create({
      data: { email, name, passwordHash, role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
      select: adminUserSelect,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AdminUserConflictError();
    }

    throw error;
  }
};
