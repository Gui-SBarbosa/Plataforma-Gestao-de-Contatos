import type { FormEvent } from "react";
import { useEffect, useState } from "react";

import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { activateOperator, createOperator, deactivateOperator, listOperators, updateOperator } from "./admin-users.api";
import type { Operator } from "./admin-users.types";

const emptyForm = { email: "", name: "", password: "", passwordConfirmation: "" };
const statusLabel = { ACTIVE: "Ativo", DISABLED: "Desativado" } as const;

export const AdminUsersPage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<Operator | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOperators = async () => {
    setIsLoading(true); setError(null);
    try { setOperators((await listOperators()).data); } catch { setError("Não foi possível carregar os operadores."); } finally { setIsLoading(false); }
  };
  useEffect(() => { void loadOperators(); }, []);
  const openCreate = () => { setEditing(null); setForm(emptyForm); setFeedback(null); setError(null); setIsFormOpen(true); };
  const openEdit = (operator: Operator) => { setEditing(operator); setForm({ email: operator.email ?? "", name: operator.name, password: "", passwordConfirmation: "" }); setFeedback(null); setError(null); setIsFormOpen(true); };
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setIsSaving(true); setFeedback(null); setError(null);
    try {
      if (editing) { await updateOperator(editing.id, { ...(editing.status === "ACTIVE" ? { email: form.email } : {}), name: form.name }); setFeedback("Operador atualizado."); }
      else { if (form.password !== form.passwordConfirmation) { setError("A confirmação de senha deve ser igual à senha informada."); setIsSaving(false); return; } await createOperator({ email: form.email, name: form.name, password: form.password }); setFeedback("Operador criado como ativo."); }
      setIsFormOpen(false); await loadOperators();
    } catch { setError("Não foi possível salvar o operador. Revise os dados ou verifique o e-mail."); }
    finally { setIsSaving(false); }
  };
  const toggleStatus = async (operator: Operator) => { setError(null); try { if (operator.status === "ACTIVE") await deactivateOperator(operator.id); else { const email = window.prompt("Informe o e-mail para reativar este operador:"); if (!email) return; await activateOperator(operator.id, email); } setFeedback(operator.status === "ACTIVE" ? "Operador desativado." : "Operador reativado."); await loadOperators(); } catch { setError("Não foi possível alterar o status do operador."); } };
  const signOut = async () => { try { await logout(); } finally { onLogout(); } };

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">G</span><span>GestCon<span className="brand-dot">.</span></span></div><nav><a className="nav-link" href="#overview">Dashboard</a><a className="nav-link" href="#contacts">Contatos</a><a className="nav-link" href="#requests">Solicitações</a><a className="nav-link active" href="#operators">Operadores</a><a className="nav-link" href="#settings">Configurações</a></nav><button className="nav-link logout-link" onClick={() => void signOut()}>Sair</button></aside><main className="content"><header className="topbar"><div><span className="breadcrumb">Administração / Operadores</span><h1>Operadores</h1></div><div className="profile"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Administrador</small></span></div></header><section className="content-head"><div><p className="eyebrow">Acessos da plataforma</p><h2>{operators.length ? "Todos os operadores" : "Criar operador"}</h2><p className="muted">{operators.length ? "Gerencie as contas que operam o cadastro de contatos." : "Crie uma conta ativa para um operador iniciar o cadastro de contatos."}</p></div>{operators.length > 0 && <button className="button button-primary" onClick={openCreate}>+ Novo operador</button>}</section>{feedback && <div className="notice success" role="status">{feedback}</div>}{error && <div className="notice danger" role="alert">{error}</div>}{isLoading ? <div className="card empty-state">Carregando operadores…</div> : operators.length === 0 ? <OperatorForm editing={null} form={form} isSaving={isSaving} onChange={setForm} onSubmit={submit} /> : <section className="card table-card"><div className="table-toolbar"><span className="muted">{operators.length} operador{operators.length === 1 ? "" : "es"}</span><button className="button button-secondary button-small" onClick={() => void loadOperators()}>Atualizar</button></div><div className="table-wrap"><table><thead><tr><th>Operador</th><th>Status</th><th>Criado em</th><th>Ações</th></tr></thead><tbody>{operators.map((operator) => <tr key={operator.id}><td><strong>{operator.name}</strong><span>{operator.email}</span></td><td><span className={`badge ${operator.status === "DISABLED" ? "badge-disabled" : ""}`}>{statusLabel[operator.status]}</span></td><td>{new Date(operator.createdAt).toLocaleDateString("pt-BR")}</td><td><div className="row-actions"><button className="button button-secondary button-small" onClick={() => openEdit(operator)}>Editar</button><button className="button button-secondary button-small" onClick={() => void toggleStatus(operator)}>{operator.status === "ACTIVE" ? "Desativar" : "Reativar"}</button></div></td></tr>)}</tbody></table></div></section>}{isFormOpen && <div className="overlay"><OperatorForm editing={editing} form={form} isSaving={isSaving} onChange={setForm} onClose={() => setIsFormOpen(false)} onSubmit={submit} /></div>}</main></div>;
};

const OperatorForm = ({ editing, form, isSaving, onChange, onClose, onSubmit }: { editing: Operator | null; form: typeof emptyForm; isSaving: boolean; onChange: (form: typeof emptyForm) => void; onClose?: () => void; onSubmit: (event: FormEvent) => void }) => <form className="card operator-form" onSubmit={onSubmit}><div className="form-section-heading"><h2>{editing ? "Editar operador" : "Dados do operador"}</h2><p className="muted">{editing ? "Atualize nome e e-mail. A senha não é exibida nem alterada nesta tela." : "A senha é enviada somente nesta requisição e nunca é exibida após o cadastro."}</p></div><div className="modal-grid"><label className="field-label full">Nome completo *<input className="input" value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} minLength={2} maxLength={120} autoComplete="name" required /></label><label className="field-label full">E-mail corporativo *<input className="input" type="email" value={form.email} onChange={(event) => onChange({ ...form, email: event.target.value })} maxLength={320} autoComplete="email" disabled={editing?.status === "DISABLED"} required={editing?.status !== "DISABLED"} placeholder={editing?.status === "DISABLED" ? "Informe ao reativar" : undefined} /></label>{!editing && <><label className="field-label">Senha *<input className="input" type="password" value={form.password} onChange={(event) => onChange({ ...form, password: event.target.value })} minLength={12} maxLength={128} autoComplete="new-password" required /></label><label className="field-label">Confirmar senha *<input className="input" type="password" value={form.passwordConfirmation} onChange={(event) => onChange({ ...form, passwordConfirmation: event.target.value })} minLength={12} maxLength={128} autoComplete="new-password" required /></label></>}</div><div className="modal-actions">{onClose ? <button className="button button-secondary" type="button" onClick={onClose}>Cancelar</button> : <a className="button button-secondary" href="#contacts">Cancelar</a>}<button className="button button-primary" disabled={isSaving}>{isSaving ? "Salvando…" : editing ? "Salvar alterações" : "Criar operador"}</button></div></form>;
