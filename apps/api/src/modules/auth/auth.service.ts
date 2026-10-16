import { verify } from "@node-rs/argon2";
import { UserRole, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { LoginInput } from "./auth.schema.js";

const authenticatedUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
} as const;

type ActiveUser = { email: string; id: string; name: string; role: UserRole; status: UserStatus };

export const authenticateUser = async ({ email, password }: LoginInput) => {
  const user = await prisma.user.findFirst({
    where: { email },
    select: { ...authenticatedUserSelect, passwordHash: true },
  });

  if (!user || !user.email || user.status !== UserStatus.ACTIVE || !(await verify(user.passwordHash, password))) {
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

export const getActiveUser = async (userId: string): Promise<ActiveUser | null> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: authenticatedUserSelect,
  });

  if (!user || user.status !== UserStatus.ACTIVE || !user.email) return null;
  return { email: user.email, id: user.id, name: user.name, role: user.role, status: user.status };
};
