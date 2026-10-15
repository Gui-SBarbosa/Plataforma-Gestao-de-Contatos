import type { FormEvent } from "react";
import { useState } from "react";

import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { createOperator } from "./admin-users.api";

const initialForm = { email: "", name: "", password: "", passwordConfirmation: "" };

export const AdminUsersPage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setFeedback(null); setError(null);
    if (form.password !== form.passwordConfirmation) { setError("A confirmação de senha deve ser igual à senha informada."); return; }
    setIsSaving(true);
    try { const operator = await createOperator({ email: form.email, name: form.name, password: form.password }); setForm(initialForm); setFeedback(`${operator.name} foi criado como operador ativo.`); }
    catch { setError("Não foi possível criar o operador. Revise os dados ou verifique se o e-mail já existe."); }
    finally { setIsSaving(false); }
  };
  const signOut = async () => { try { await logout(); } finally { onLogout(); } };
  return <div className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark">G</span><span>GestCon<span className="brand-dot">.</span></span></div><nav><a className="nav-link" href="#overview">Dashboard</a><a className="nav-link" href="#contacts">Contatos</a><a className="nav-link" href="#requests">Solicitações</a><a className="nav-link active" href="#operators">Operadores</a><a className="nav-link" href="#settings">Configurações</a></nav><button className="nav-link logout-link" onClick={() => void signOut()}>Sair</button></aside><main className="content"><header className="topbar"><div><span className="breadcrumb">Administração / Operadores</span><h1>Operadores</h1></div><div className="profile"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>Administrador</small></span></div></header><section className="content-head"><div><p className="eyebrow">Acessos da plataforma</p><h2>Criar operador</h2><p className="muted">Crie uma conta ativa para um operador iniciar o cadastro de contatos.</p></div></section>{feedback && <div className="notice success" role="status">{feedback}</div>}{error && <div className="notice danger" role="alert">{error}</div>}<form className="card operator-form" onSubmit={submit}><div className="form-section-heading"><h2>Dados do operador</h2><p className="muted">A senha é enviada somente nesta requisição e nunca é exibida após o cadastro.</p></div><div className="modal-grid"><label className="field-label full">Nome completo *<input className="input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} minLength={2} maxLength={120} autoComplete="name" required /></label><label className="field-label">E-mail corporativo *<input className="input" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} maxLength={320} autoComplete="email" required /></label><label className="field-label">Senha *<input className="input" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} minLength={12} maxLength={128} autoComplete="new-password" required /></label><label className="field-label">Confirmar senha *<input className="input" type="password" value={form.passwordConfirmation} onChange={(event) => setForm({ ...form, passwordConfirmation: event.target.value })} minLength={12} maxLength={128} autoComplete="new-password" required /></label></div><div className="modal-actions"><a className="button button-secondary" href="#contacts">Cancelar</a><button className="button button-primary" disabled={isSaving}>{isSaving ? "Criando…" : "Criar operador"}</button></div></form></main></div>;
};
