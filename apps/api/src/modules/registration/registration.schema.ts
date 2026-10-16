import { z } from "zod";

import { passwordSchema } from "../../shared/password-policy.js";

export const registrationSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  name: z.string().trim().min(2).max(120),
  password: passwordSchema,
});

export const registrationTrackingSchema = z.object({
  trackingToken: z.string().min(43).max(128),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
