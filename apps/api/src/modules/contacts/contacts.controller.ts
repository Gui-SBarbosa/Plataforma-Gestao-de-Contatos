import type { RequestHandler } from "express";

import { createContactSchema } from "./contacts.schema.js";
import { createContact } from "./contacts.service.js";

export const create: RequestHandler = async (request, response, next) => {
  const input = createContactSchema.safeParse(request.body);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const contact = await createContact(input.data, request.authUser!.id);

    response.status(201).json({ data: { contact } });
  } catch (error) {
    next(error);
  }
};
