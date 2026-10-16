import { UserRole, UserStatus } from "@prisma/client";

import { prisma } from "../../config/prisma.js";

import type { DashboardQuery } from "./dashboard.schema.js";

const periodFor = (date: Date, interval: DashboardQuery["interval"]) => {
  if (interval === "month") return date.toISOString().slice(0, 7);
  if (interval === "day") return date.toISOString().slice(0, 10);

  const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  weekStart.setUTCDate(weekStart.getUTCDate() - ((weekStart.getUTCDay() + 6) % 7));
  return weekStart.toISOString().slice(0, 10);
};

export const getDashboard = async (
  query: DashboardQuery,
  viewer: { id: string; role: UserRole },
) => {
  if (viewer.role !== UserRole.ADMIN && query.operatorId) return null;
  const start = query.from
    ? new Date(query.from + "T00:00:00.000Z")
    : undefined;
  const end = query.to ? new Date(query.to + "T23:59:59.999Z") : undefined;
  if (start && end && start > end) return undefined;
  const where = {
    ...(viewer.role === UserRole.OPERATOR
      ? { createdById: viewer.id }
      : query.operatorId
        ? { createdById: query.operatorId }
        : {}),
    ...(start || end
      ? {
          createdAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: end } : {}),
          },
        }
      : {}),
  };
  const [contacts, availableOperators] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        createdBy: { select: { id: true, name: true } },
        source: true,
      },
      where,
    }),
    viewer.role === UserRole.ADMIN
      ? prisma.user.findMany({
          orderBy: { name: "asc" },
          select: { id: true, name: true },
          where: { role: UserRole.OPERATOR, status: UserStatus.ACTIVE },
        })
      : Promise.resolve([]),
  ]);
  const sources = Object.fromEntries(
    ["WEBSITE", "REFERRAL", "SOCIAL_MEDIA", "PHONE", "OTHER"].map((source) => [
      source,
      0,
    ]),
  );
  const series = new Map<string, number>();
  const operators = new Map<
    string,
    { id: string; name: string; total: number }
  >();
  for (const contact of contacts) {
    sources[contact.source] += 1;
    const period = periodFor(contact.createdAt, query.interval);
    series.set(period, (series.get(period) ?? 0) + 1);
    if (viewer.role === UserRole.ADMIN) {
      const value = operators.get(contact.createdBy.id) ?? {
        id: contact.createdBy.id,
        name: contact.createdBy.name,
        total: 0,
      };
      value.total += 1;
      operators.set(contact.createdBy.id, value);
    }
  }
  return {
    availableOperators,
    byOperator: [...operators.values()].sort((a, b) => b.total - a.total),
    bySource: Object.entries(sources).map(([source, total]) => ({
      source,
      total,
    })),
    interval: query.interval,
    series: [...series.entries()].map(([period, total]) => ({ period, total })),
    summary: { contacts: contacts.length },
  };
};
