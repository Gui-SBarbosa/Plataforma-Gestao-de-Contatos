import { z } from "zod";

export const dashboardQuerySchema = z.object({
  from: z.iso.date().optional(),
  interval: z.enum(["day", "week", "month"]).default("day"),
  operatorId: z.uuid().optional(),
  to: z.iso.date().optional(),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;
