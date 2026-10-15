import { ContactSource } from "@prisma/client";
import { z } from "zod";

export const createContactSchema = z.object({
  city: z.string().trim().min(1).max(120).optional(),
  company: z.string().trim().min(1).max(160).optional(),
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(32),
  source: z.nativeEnum(ContactSource),
});

export const contactIdSchema = z.object({
  id: z.uuid(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
