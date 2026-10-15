import { z } from "zod";

export const createAdminOperatorSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(12).max(128),
});

export const listPendingUsersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.literal("PENDING").optional(),
});

export const listOperatorsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum(["ACTIVE", "DISABLED"]).optional(),
});

export const updateOperatorSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320).optional(),
  name: z.string().trim().min(2).max(120),
});

export const activateOperatorSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
});

export const userIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateAdminOperatorInput = z.infer<typeof createAdminOperatorSchema>;
export type ListPendingUsersInput = z.infer<typeof listPendingUsersSchema>;
export type ListOperatorsInput = z.infer<typeof listOperatorsSchema>;
export type UpdateOperatorInput = z.infer<typeof updateOperatorSchema>;
export type ActivateOperatorInput = z.infer<typeof activateOperatorSchema>;
