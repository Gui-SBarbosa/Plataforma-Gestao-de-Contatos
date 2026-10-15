import { hash } from "@node-rs/argon2";
import { Prisma, UserRole, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { ActivateOperatorInput, CreateAdminOperatorInput, ListOperatorsInput, ListPendingUsersInput, UpdateOperatorInput } from "./admin-users.schema.js";

export class AdminUserConflictError extends Error {}
export class PendingUserNotFoundError extends Error {}
export class UserDecisionConflictError extends Error {}
export class OperatorNotFoundError extends Error {}
export class OperatorConflictError extends Error {}

const adminUserSelect = {
  email: true,
  id: true,
  name: true,
  role: true,
  status: true,
} as const;

const decisionUserSelect = {
  ...adminUserSelect,
  approvedAt: true,
  updatedAt: true,
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

export const listOperators = async ({ page, pageSize, status }: ListOperatorsInput) => {
  const where = { role: UserRole.OPERATOR, ...(status ? { status } : { status: { in: [UserStatus.ACTIVE, UserStatus.DISABLED] } }) };
  const [total, users] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({ orderBy: [{ status: "asc" }, { name: "asc" }], select: { ...adminUserSelect, createdAt: true, updatedAt: true }, skip: (page - 1) * pageSize, take: pageSize, where }),
  ]);
  return { page, pageSize, total, totalPages: Math.ceil(total / pageSize), users };
};

export const updateOperator = async (userId: string, input: UpdateOperatorInput) => {
  try {
    const current = await prisma.user.findFirst({ where: { id: userId, role: UserRole.OPERATOR }, select: { status: true } });
    if (!current) throw new OperatorNotFoundError();
    if (current.status === UserStatus.DISABLED && input.email) throw new OperatorConflictError();
    return await prisma.user.update({
      data: { name: input.name, ...(input.email ? { email: input.email } : {}) },
      where: { id: userId, role: UserRole.OPERATOR },
      select: { ...adminUserSelect, createdAt: true, updatedAt: true },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") throw new OperatorNotFoundError();
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new OperatorConflictError();
    throw error;
  }
};

export const setOperatorStatus = async (userId: string, status: "ACTIVE" | "DISABLED", input?: ActivateOperatorInput) => {
  let result;
  try {
    result = await prisma.user.updateMany({ data: status === "DISABLED" ? { email: null, status } : { email: input!.email, status }, where: { id: userId, role: UserRole.OPERATOR, status: { in: [UserStatus.ACTIVE, UserStatus.DISABLED] } } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new OperatorConflictError();
    throw error;
  }
  if (result.count === 0) {
    const user = await prisma.user.findFirst({ where: { id: userId, role: UserRole.OPERATOR }, select: { id: true } });
    if (!user) throw new OperatorNotFoundError();
    throw new OperatorConflictError();
  }
  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ...adminUserSelect, createdAt: true, updatedAt: true } });
};

const decidePendingUser = async (
  userId: string,
  administratorId: string,
  status: (typeof UserStatus)["ACTIVE"] | (typeof UserStatus)["REJECTED"],
) => {
  const decisionData =
    status === UserStatus.ACTIVE
      ? { approvedAt: new Date(), approvedById: administratorId, status }
      : { email: null, status };
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

  return prisma.user.findUniqueOrThrow({ where: { id: userId }, select: decisionUserSelect });
};

export const approvePendingUser = (userId: string, administratorId: string) =>
  decidePendingUser(userId, administratorId, UserStatus.ACTIVE);

export const rejectPendingUser = (userId: string, administratorId: string) =>
  decidePendingUser(userId, administratorId, UserStatus.REJECTED);
