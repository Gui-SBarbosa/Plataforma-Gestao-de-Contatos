import { useCallback, useEffect, useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { listAuditLogs } from "./audit.api";
import type { AuditLog, AuditPage as AuditPageData } from "./audit.types";

const actionLabels: Record<string, string> = {
  AUTH_LOGIN_FAILED: "Tentativa de login inválida",
  AUTH_LOGIN_SUCCEEDED: "Login realizado",
  AUTH_LOGOUT: "Logout realizado",
  CONTACT_CREATED: "Contato criado",
  REGISTRATION_REQUESTED: "Solicitação criada",
  USER_APPROVED: "Solicitação aprovada",
  USER_CREATED: "Operador criado",
  USER_DISABLED: "Operador desativado",
  USER_REACTIVATED: "Operador reativado",
  USER_REJECTED: "Solicitação rejeitada",
  USER_UPDATED: "Operador atualizado",
};

const AuditIcon = ({ name }: { name: "activity" | "calendar" | "clock" }) => <svg className="audit-metric-icon" viewBox="0 0 24 24" aria-hidden="true">{name === "activity" ? <><path d="M3 12h4l2-6 4 12 2-6h6" /></> : name === "calendar" ? <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></> : <><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></>}</svg>;

const descriptionFor = (log: AuditLog) => {
  const actor = log.actor?.name ?? "Sistema";
  if (log.action === "CONTACT_CREATED") return `${actor} cadastrou um novo contato.`;
  if (log.action === "REGISTRATION_REQUESTED") return "Uma nova solicitação de acesso foi enviada.";
  if (log.action === "USER_APPROVED") return `${actor} aprovou uma solicitação de operador.`;
  if (log.action === "USER_REJECTED") return `${actor} rejeitou uma solicitação de operador.`;
  if (log.action === "USER_CREATED") return `${actor} criou um operador ativo.`;
  if (log.action === "USER_UPDATED") return `${actor} atualizou os dados de um operador.`;
  if (log.action === "USER_DISABLED") return `${actor} desativou um operador.`;
  if (log.action === "USER_REACTIVATED") return `${actor} reativou um operador.`;
  if (log.action === "AUTH_LOGIN_FAILED") return "Uma tentativa de login não foi autorizada.";
  if (log.action === "AUTH_LOGOUT") return `${actor} encerrou a sessão.`;
  return `${actor} iniciou uma sessão.`;
};

export const AuditPage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [auditPage, setAuditPage] = useState<AuditPageData | null>(null);
  const [action, setAction] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const signOut = async () => { try { await logout(); } finally { onLogout(); } };
  const load = useCallback(async (page = 1, nextAction = action) => {
    setIsLoading(true);
    try { setAuditPage(await listAuditLogs(page, nextAction)); } finally { setIsLoading(false); }
  }, [action]);
  useEffect(() => { void load(1); }, [load]);

  const updateAction = (value: string) => { setAction(value); void load(1, value); };
  const summary = auditPage?.meta.summary;

  return <AppShell activeSection="audit" breadcrumb="Administração / Auditoria" onLogout={() => void signOut()} title="Auditoria" user={user}>
    <section className="dashboard-page-head audit-page-head"><div><p className="eyebrow">Rastreabilidade</p><h2>Auditoria administrativa</h2><p className="muted">Acompanhe as ações relevantes da operação de forma segura.</p></div><label className="filter-field">Tipo de evento<select className="input" value={action} onChange={(event) => updateAction(event.target.value)}><option value="">Todos os eventos</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></section>
    <section className="audit-metrics"><article className="card audit-metric"><span><AuditIcon name="activity" /></span><div><small>Total de eventos</small><strong>{summary?.total ?? "—"}</strong></div></article><article className="card audit-metric"><span><AuditIcon name="calendar" /></span><div><small>Eventos hoje</small><strong>{summary?.today ?? "—"}</strong></div></article><article className="card audit-metric"><span><AuditIcon name="clock" /></span><div><small>Últimos 7 dias</small><strong>{summary?.week ?? "—"}</strong></div></article></section>
    <section className="card audit-card">{isLoading ? <EmptyState>Carregando eventos…</EmptyState> : !auditPage?.data.length ? <EmptyState><strong>Nenhum evento encontrado</strong><span>Ajuste o filtro ou aguarde novas ações na operação.</span></EmptyState> : <><div className="audit-list">{auditPage.data.map((log) => <button className="audit-row" key={log.id} type="button" onClick={() => setSelected(log)}><span className="audit-event-dot" /><span className="audit-row-copy"><strong>{actionLabels[log.action] ?? log.action}</strong><small>{descriptionFor(log)}</small></span><time dateTime={log.createdAt}>{new Date(log.createdAt).toLocaleString("pt-BR")}</time></button>)}</div>{auditPage.meta.totalPages > 1 && <PaginationControls isLoading={isLoading} onNext={() => void load(auditPage.meta.page + 1)} onPrevious={() => void load(auditPage.meta.page - 1)} page={auditPage.meta.page} totalPages={auditPage.meta.totalPages} />}</>}</section>
    {selected && <div className="overlay" onMouseDown={() => setSelected(null)}><article aria-modal="true" className="modal audit-detail" onMouseDown={(event) => event.stopPropagation()} role="dialog"><div className="modal-head"><div><p className="eyebrow">Evento de auditoria</p><h2>{actionLabels[selected.action] ?? selected.action}</h2></div><button className="close-button" onClick={() => setSelected(null)} type="button" aria-label="Fechar">×</button></div><div className="audit-detail-body"><p>{descriptionFor(selected)}</p><dl><div><dt>Responsável</dt><dd>{selected.actor?.name ?? "Sistema"}</dd></div><div><dt>Data e hora</dt><dd>{new Date(selected.createdAt).toLocaleString("pt-BR")}</dd></div><div><dt>Registro</dt><dd>{selected.entityType}</dd></div></dl></div></article></div>}
  </AppShell>;
};
