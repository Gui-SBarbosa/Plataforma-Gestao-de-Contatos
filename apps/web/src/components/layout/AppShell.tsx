import type { ReactNode } from "react";

import type { AuthUser } from "../../features/auth/auth.types";
import { Brand } from "./Brand";

export type AppSection = "contacts" | "operators" | "overview" | "requests";

type AppShellProps = {
  activeSection: AppSection;
  breadcrumb: string;
  children: ReactNode;
  contactCount?: number;
  onLogout: () => void;
  title: string;
  user: AuthUser;
};

export const AppShell = ({ activeSection, breadcrumb, children, contactCount, onLogout, title, user }: AppShellProps) => {
  const isAdmin = user.role === "ADMIN";

  return <div className="app-shell"><aside className="sidebar"><Brand /><nav><a className={`nav-link ${activeSection === "overview" ? "active" : ""}`} href="#overview">Dashboard</a><a className={`nav-link ${activeSection === "contacts" ? "active" : ""}`} href="#contacts">Contatos {contactCount !== undefined && <span className="nav-badge">{contactCount}</span>}</a>{isAdmin && <><a className={`nav-link ${activeSection === "requests" ? "active" : ""}`} href="#requests">Solicitações</a><a className={`nav-link ${activeSection === "operators" ? "active" : ""}`} href="#operators">Operadores</a></>}<a className="nav-link" href="#settings">Configurações</a></nav><button className="nav-link logout-link" onClick={onLogout}>Sair</button></aside><main className="content"><header className="topbar"><div><span className="breadcrumb">{breadcrumb}</span><h1>{title}</h1></div><div className="profile"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span><span><strong>{user.name}</strong><small>{isAdmin ? "Administrador" : "Operador"}</small></span></div></header>{children}</main></div>;
};
