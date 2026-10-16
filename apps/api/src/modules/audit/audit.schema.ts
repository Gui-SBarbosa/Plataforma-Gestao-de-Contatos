import { z } from "zod";

export const listAuditLogsSchema = z.object({
  action: z.string().trim().min(1).max(80).optional(),
  from: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
  to: z.coerce.date().optional(),
});

export type ListAuditLogsInput = z.infer<typeof listAuditLogsSchema>;
