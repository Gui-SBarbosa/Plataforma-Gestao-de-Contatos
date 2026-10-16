import { useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";

export const ProfilePage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  const signOut = async () => {
    try {
      await logout();
    } finally {
      onLogout();
    }
  };

  return <AppShell activeSection="profile" breadcrumb="Conta / Meu perfil" onLogout={() => void signOut()} title="Meu perfil" user={user}>
    <section className="settings-page-head"><div><p className="eyebrow">Sua conta</p><h2>Meu perfil</h2><p className="muted">Atualize as informações usadas para identificar você na plataforma.</p></div></section>
    {feedback && <div className="notice success">{feedback}</div>}
    <section className="card settings-card profile-card"><div className="settings-card-head"><div><h3>Dados pessoais</h3><p>Essas informações aparecem no seu perfil e nos registros da operação.</p></div><span className="settings-card-icon">◎</span></div><div className="settings-form-grid"><label className="field-label">Nome completo<input className="input" defaultValue={user.name} /></label><label className="field-label">E-mail<input className="input" defaultValue={user.email} type="email" /></label><label className="field-label">Cargo<input className="input" value={user.role === "ADMIN" ? "Administrador" : "Operador"} disabled /></label></div><div className="settings-actions"><button className="button button-primary" onClick={() => setFeedback("Dados do perfil prontos para serem salvos.")}>Salvar alterações</button></div></section>
  </AppShell>;
};
