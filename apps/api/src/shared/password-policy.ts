import { z } from "zod";

export const passwordSchema = z.string()
  .min(8)
  .max(128)
  .regex(/[A-Z]/)
  .regex(/[0-9]/)
  .regex(/[^A-Za-z0-9]/);
