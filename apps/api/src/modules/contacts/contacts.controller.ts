import type { RequestHandler } from "express";

import { contactIdSchema, createContactSchema, listContactsSchema } from "./contacts.schema.js";
import { createContact, findVisibleContact, listVisibleContacts } from "./contacts.service.js";

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

export const getById: RequestHandler = async (request, response, next) => {
  const input = contactIdSchema.safeParse(request.params);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const contact = await findVisibleContact(input.data.id, request.authUser!);

    if (!contact) {
      response.status(404).json({
        error: { code: "CONTACT_NOT_FOUND", message: "Unable to process the request.", requestId: request.id },
      });
      return;
    }

    response.status(200).json({ data: { contact } });
  } catch (error) {
    next(error);
  }
};

export const list: RequestHandler = async (request, response, next) => {
  const input = listContactsSchema.safeParse(request.query);

  if (!input.success) {
    response.status(400).json({
      error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id },
    });
    return;
  }

  try {
    const result = await listVisibleContacts(input.data, request.authUser!);

    response.status(200).json({
      data: result.contacts,
      meta: { page: result.page, pageSize: result.pageSize, total: result.total, totalPages: result.totalPages },
    });
  } catch (error) {
    next(error);
  }
};
