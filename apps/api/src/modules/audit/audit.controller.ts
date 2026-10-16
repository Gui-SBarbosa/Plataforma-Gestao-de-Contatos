import type { RequestHandler } from "express";

import { listAuditLogsSchema } from "./audit.schema.js";
import { listAuditLogs } from "./audit.service.js";

export const list: RequestHandler = async (request, response, next) => {
  const input = listAuditLogsSchema.safeParse(request.query);
  if (!input.success) {
    response.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Unable to process the request.", requestId: request.id } });
    return;
  }

  try {
    const result = await listAuditLogs(input.data);
    response.status(200).json({
      data: result.logs,
      meta: { page: result.page, pageSize: result.pageSize, summary: result.summary, total: result.total, totalPages: result.totalPages },
    });
  } catch (error) {
    next(error);
  }
};
