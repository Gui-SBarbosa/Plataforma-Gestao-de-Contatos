import { prisma } from "../../config/prisma.js";

import type { ListAuditLogsInput } from "./audit.schema.js";

const auditLogSelect = {
  action: true,
  actor: { select: { name: true } },
  actorId: true,
  createdAt: true,
  entityId: true,
  entityType: true,
  id: true,
  metadata: true,
} as const;

export const recordAuditEvent = (input: { action: string; actorId?: string; entityId?: string; entityType: string; metadata?: Record<string, string> }) =>
  prisma.auditLog.create({ data: input });

export const listAuditLogs = async ({ action, from, page, pageSize, to }: ListAuditLogsInput) => {
  const where = {
    ...(action ? { action } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}),
  };
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const [total, todayTotal, weekTotal, logs] = await prisma.$transaction([
    prisma.auditLog.count({ where }),
    prisma.auditLog.count({ where: { ...where, createdAt: { ...(where.createdAt ?? {}), gte: today } } }),
    prisma.auditLog.count({ where: { ...where, createdAt: { ...(where.createdAt ?? {}), gte: sevenDaysAgo } } }),
    prisma.auditLog.findMany({
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: auditLogSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
      where,
    }),
  ]);

  return { logs, page, pageSize, summary: { today: todayTotal, total, week: weekTotal }, total, totalPages: Math.ceil(total / pageSize) };
};
