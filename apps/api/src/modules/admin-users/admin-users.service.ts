import { hash } from "@node-rs/argon2";
import { Prisma, UserRole, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { CreateAdminOperatorInput } from "./admin-users.schema.js";
import type { ListPendingUsersInput } from "./admin-users.schema.js";

export class AdminUserConflictError extends Error {}
export class PendingUserNotFoundError extends Error {}
export class UserDecisionConflictError extends Error {}

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

export const listPendingUsers = async ({ page, pageSize }: ListPendingUsersInput) => {
  const where = { role: UserRole.OPERATOR, status: UserStatus.PENDING };
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: adminUserSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
    }),
  ]);

  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize), users };
};

const decidePendingUser = async (
  userId: string,
  administratorId: string,
  status: (typeof UserStatus)["ACTIVE"] | (typeof UserStatus)["REJECTED"],
) => {
  const decisionData =
    status === UserStatus.ACTIVE
      ? { approvedAt: new Date(), approvedById: administratorId, status }
      : { status };
  const result = await prisma.user.updateMany({
    data: decisionData,
    where: { id: userId, role: UserRole.OPERATOR, status: UserStatus.PENDING },
  });

  if (result.count === 0) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (!user) {
      throw new PendingUserNotFoundError();
    }

    throw new UserDecisionConflictError();
  }

  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: adminUserSelect });
};

export const approvePendingUser = (userId: string, administratorId: string) =>
  decidePendingUser(userId, administratorId, UserStatus.ACTIVE);

export const rejectPendingUser = (userId: string, administratorId: string) =>
  decidePendingUser(userId, administratorId, UserStatus.REJECTED);
