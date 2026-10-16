import { useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";

export const SettingsPage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [contactNotifications, setContactNotifications] = useState(true);
  const [requestNotifications, setRequestNotifications] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const signOut = async () => {
    try {
      await logout();
    } finally {
      onLogout();
    }
  };

  return <AppShell activeSection="settings" breadcrumb="Conta / Configurações" onLogout={() => void signOut()} title="Configurações" user={user}>
    <section className="settings-page-head"><div><p className="eyebrow">Preferências da conta</p><h2>Configurações</h2><p className="muted">Gerencie a segurança e as preferências de notificações da sua conta.</p></div></section>
    {feedback && <div className="notice success">{feedback}</div>}
    <div className="settings-grid">
      <section className="card settings-card"><div className="settings-card-head"><div><h3>Segurança</h3><p>Atualize sua senha para manter sua conta protegida.</p></div><span className="settings-card-icon">⌁</span></div><div className="settings-form-grid"><label className="field-label full">Senha atual<input className="input" type="password" placeholder="Digite sua senha atual" /></label><label className="field-label">Nova senha<input className="input" type="password" placeholder="Mínimo de 12 caracteres" /></label><label className="field-label">Confirmar nova senha<input className="input" type="password" placeholder="Repita a nova senha" /></label></div><div className="settings-actions"><button className="button button-secondary" onClick={() => setFeedback("A alteração de senha ficará disponível nesta etapa.")}>Alterar senha</button></div></section>
      <section className="card settings-card"><div className="settings-card-head"><div><h3>Notificações</h3><p>Escolha quais eventos devem aparecer na central.</p></div><span className="settings-card-icon">◌</span></div><div className="settings-preferences"><label className="settings-toggle"><span><strong>Novos contatos</strong><small>Alertas de cadastros realizados.</small></span><input checked={contactNotifications} onChange={(event) => setContactNotifications(event.target.checked)} type="checkbox" /><i aria-hidden="true" /></label>{user.role === "ADMIN" && <label className="settings-toggle"><span><strong>Solicitações de cadastro</strong><small>Alertas de novos pedidos de acesso.</small></span><input checked={requestNotifications} onChange={(event) => setRequestNotifications(event.target.checked)} type="checkbox" /><i aria-hidden="true" /></label>}</div><div className="settings-actions"><button className="button button-primary" onClick={() => setFeedback("Preferências de notificações salvas.")}>Salvar preferências</button></div></section>
    </div>
  </AppShell>;
};
