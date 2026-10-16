import { useEffect, useState, type ReactNode } from "react";

import type { AuthUser } from "../../features/auth/auth.types";
import { listContacts } from "../../features/contacts/contacts.api";
import { Brand } from "./Brand";

export type AppSection = "contacts" | "operators" | "overview" | "requests";

const TopbarIcon = ({ name }: { name: "bell" | "chevron" | "shield" }) => {
  if (name === "bell") return <svg className="topbar-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;
  if (name === "shield") return <svg className="topbar-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.6 2.9 8.1 7 10 4.1-1.9 7-5.4 7-10V6l-7-3Z" /><path d="m9.5 12 1.7 1.7 3.5-3.5" /></svg>;
  return <svg className="topbar-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>;
};

type AppShellProps = {
  activeSection: AppSection;
  breadcrumb: string;
  children: ReactNode;
  contactCount?: number;
  onLogout: () => void;
  title: string;
  user: AuthUser;
};

export const AppShell = ({ activeSection, children, contactCount: initialContactCount, onLogout, user }: AppShellProps) => {
  const isAdmin = user.role === "ADMIN";
  const [sidebarContactCount, setSidebarContactCount] = useState<number | undefined>(initialContactCount);

  useEffect(() => {
    let active = true;
    setSidebarContactCount(initialContactCount);
    void listContacts(1).then((page) => {
      if (active) setSidebarContactCount(page.meta.total);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [initialContactCount]);

  const contactCount = sidebarContactCount;

  return <div className="app-shell"><aside className="sidebar"><Brand /><nav><a className={`nav-link ${activeSection === "overview" ? "active" : ""}`} href="#overview">Dashboard</a><a className={`nav-link ${activeSection === "contacts" ? "active" : ""}`} href="#contacts">Contatos {contactCount !== undefined && <span className="nav-badge">{contactCount}</span>}</a>{isAdmin && <><a className={`nav-link ${activeSection === "requests" ? "active" : ""}`} href="#requests">Solicitações</a><a className={`nav-link ${activeSection === "operators" ? "active" : ""}`} href="#operators">Operadores</a></>}<a className="nav-link" href="#settings">Configurações</a></nav><button className="nav-link logout-link" onClick={onLogout}>Sair</button></aside><main className="content"><header className="topbar"><div className="topbar-actions"><span className={`role-chip ${isAdmin ? "" : "operator"}`}><TopbarIcon name="shield" />{isAdmin ? "Administrador" : "Operador"}</span><button className="topbar-icon-button topbar-bell" type="button" aria-label="Notificações"><TopbarIcon name="bell" /></button><div className="topbar-profile"><span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span><span className="topbar-profile-meta"><strong>{user.name}</strong><small>{isAdmin ? "Administrador" : "Operador"}</small></span><TopbarIcon name="chevron" /></div></div></header>{children}</main></div>;
};
