export type AuditLog = {
  action: string;
  actor: { name: string } | null;
  actorId: string | null;
  createdAt: string;
  entityId: string | null;
  entityType: string;
  id: string;
  metadata: Record<string, unknown> | null;
};

export type AuditPage = {
  data: AuditLog[];
  meta: { page: number; pageSize: number; summary: { today: number; total: number; week: number }; total: number; totalPages: number };
};
