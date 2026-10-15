import { useEffect, useState } from "react";

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
    setIsLoading(true);
    setError(null);
    try {
      const response = await listPendingRequests(nextPage);
      setRequests(response.data);
      setPage(response.meta.page);
      setTotalPages(response.meta.totalPages || 1);
    } catch {
      setError("Não foi possível carregar as solicitações.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { void loadRequests(1); }, []);

  const decide = async (request: PendingRequest, decision: "approve" | "reject") => {
    setProcessingId(request.id);
    setFeedback(null);
    setError(null);
    try {
      await (decision === "approve" ? approveRequest(request.id) : rejectRequest(request.id));
      setFeedback(decision === "approve" ? "Solicitação aprovada." : "Solicitação rejeitada.");
      await loadRequests(page);
    } catch {
      setError("Não foi possível concluir a decisão. Atualize a lista e tente novamente.");
    } finally {
      setProcessingId(null);
    }
  };

  const signOut = async () => { try { await logout(); } finally { onLogout(); } };

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">G</span><span>GestCon<span className="brand-dot">.</span></span></div><nav><a className="nav-link" href="#overview">Dashboard</a><a className="nav-link" href="#contacts">Contatos</a><a className="nav-link active" href="#requests">Solicitações</a><a className="nav-link" href="#operators">Operadores</a><a className="nav-link" href="#settings">Configurações</a></nav><button className="nav-link logout-link" onClick={() => void signOut()}>Sair</button></aside><main className="content"><header className="topbar"><div><span className="breadcrumb">Administração / Solicitações</span><h1>Solicitações</h1></div><div className="profile"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Administrador</small></span></div></header><section className="content-head"><div><p className="eyebrow">Aguardando análise</p><h2>Solicitações de operadores</h2><p className="muted">Revise novos pedidos de acesso antes de liberar uma conta.</p></div><button className="button button-secondary button-small" onClick={() => void loadRequests()} disabled={isLoading}>Atualizar</button></section>{feedback && <div className="notice success" role="status">{feedback}</div>}{error && <div className="notice danger" role="alert">{error}</div>}{isLoading ? <div className="card empty-state">Carregando solicitações…</div> : requests.length === 0 ? <div className="card empty-state"><strong>Nenhuma solicitação pendente</strong><span>Novos pedidos aparecerão aqui.</span></div> : <section className="card table-card"><div className="table-toolbar"><span className="muted">{requests.length} nesta página</span></div><div className="table-wrap"><table><thead><tr><th>Solicitante</th><th>Solicitado em</th><th>Ações</th></tr></thead><tbody>{requests.map((requestItem) => <tr key={requestItem.id}><td><strong>{requestItem.name}</strong><span>{requestItem.email}</span></td><td>Em análise</td><td><div className="row-actions"><button className="button button-primary button-small" disabled={processingId !== null} onClick={() => void decide(requestItem, "approve")}>Aprovar</button><button className="button button-secondary button-small" disabled={processingId !== null} onClick={() => void decide(requestItem, "reject")}>Rejeitar</button></div></td></tr>)}</tbody></table></div><div className="pagination"><button className="button button-secondary button-small" disabled={page <= 1 || isLoading} onClick={() => void loadRequests(page - 1)}>Anterior</button><span>Página {page} de {totalPages}</span><button className="button button-secondary button-small" disabled={page >= totalPages || isLoading} onClick={() => void loadRequests(page + 1)}>Próxima</button></div></section>}</main></div>;
};
