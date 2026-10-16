import { request } from "../../services/http";

import type { AuditPage } from "./audit.types";

export const listAuditLogs = (page = 1, action = "") => request<AuditPage>(`/api/admin/audit-logs?page=${page}&pageSize=15${action ? `&action=${encodeURIComponent(action)}` : ""}`);
