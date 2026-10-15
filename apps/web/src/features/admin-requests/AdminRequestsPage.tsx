import { useEffect, useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { FeedbackNotice } from "../../components/ui/FeedbackNotice";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { approveRequest, listPendingRequests, rejectRequest } from "./admin-requests.api";
import type { PendingRequest } from "./admin-requests.types";

export const AdminRequestsPage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadRequests = async (nextPage = page) => {
    setIsLoading(true); setError(null);
    try { const response = await listPendingRequests(nextPage); setRequests(response.data); setPage(response.meta.page); setTotalPages(response.meta.totalPages || 1); } catch { setError("Não foi possível carregar as solicitações."); } finally { setIsLoading(false); }
  };

  useEffect(() => { void loadRequests(1); }, []);

  const decide = async (request: PendingRequest, decision: "approve" | "reject") => {
    setProcessingId(request.id); setFeedback(null); setError(null);
    try { await (decision === "approve" ? approveRequest(request.id) : rejectRequest(request.id)); setFeedback(decision === "approve" ? "Solicitação aprovada." : "Solicitação rejeitada."); await loadRequests(page); } catch { setError("Não foi possível concluir a decisão. Atualize a lista e tente novamente."); } finally { setProcessingId(null); }
  };

  const signOut = async () => { try { await logout(); } finally { onLogout(); } };

  return <AppShell activeSection="requests" breadcrumb="Administração / Solicitações" onLogout={() => void signOut()} title="Solicitações" user={user}><section className="content-head"><div><p className="eyebrow">Aguardando análise</p><h2>Solicitações de operadores</h2><p className="muted">Revise novos pedidos de acesso antes de liberar uma conta.</p></div><button className="button button-secondary button-small" onClick={() => void loadRequests()} disabled={isLoading}>Atualizar</button></section>{feedback && <FeedbackNotice tone="success">{feedback}</FeedbackNotice>}{error && <FeedbackNotice tone="danger">{error}</FeedbackNotice>}{isLoading ? <EmptyState>Carregando solicitações…</EmptyState> : requests.length === 0 ? <EmptyState><strong>Nenhuma solicitação pendente</strong><span>Novos pedidos aparecerão aqui.</span></EmptyState> : <section className="card table-card"><div className="table-toolbar"><span className="muted">{requests.length} nesta página</span></div><div className="table-wrap"><table><thead><tr><th>Solicitante</th><th>Status</th><th>Ações</th></tr></thead><tbody>{requests.map((requestItem) => <tr key={requestItem.id}><td><strong>{requestItem.name}</strong><span>{requestItem.email}</span></td><td><span className="badge">Em análise</span></td><td><div className="row-actions"><button className="button button-primary button-small" disabled={processingId !== null} onClick={() => void decide(requestItem, "approve")}>Aprovar</button><button className="button button-secondary button-small" disabled={processingId !== null} onClick={() => void decide(requestItem, "reject")}>Rejeitar</button></div></td></tr>)}</tbody></table></div><PaginationControls isLoading={isLoading} onNext={() => void loadRequests(page + 1)} onPrevious={() => void loadRequests(page - 1)} page={page} totalPages={totalPages} /></section>}</AppShell>;
};
