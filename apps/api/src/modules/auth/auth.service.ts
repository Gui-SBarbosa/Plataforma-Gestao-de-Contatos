import { verify } from "@node-rs/argon2";
import { UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { LoginInput } from "./auth.schema.js";

const authenticatedUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} as const;

export const authenticateUser = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { ...authenticatedUserSelect, passwordHash: true },
  });

  if (!user || user.status !== UserStatus.ACTIVE || !(await verify(user.passwordHash, password))) {
    return null;
  }

  return {
    email: user.email,
    id: user.id,
    name: user.name,
    role: user.role,
    status: user.status,
  };
};

export const getActiveUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: authenticatedUserSelect,
  });

  return user?.status === UserStatus.ACTIVE ? user : null;
};
