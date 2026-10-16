import { useEffect, useState, type ReactNode } from "react";

import type { AuthUser } from "../../features/auth/auth.types";
import { listPendingRequests } from "../../features/admin-requests/admin-requests.api";
import { listContacts } from "../../features/contacts/contacts.api";
import { NotificationBell } from "../../features/notifications/NotificationBell";
import { useNotifications } from "../../features/notifications/useNotifications";
import { useRealtimeEvents } from "../../services/useRealtimeEvents";
import { Brand } from "./Brand";

export type AppSection = "audit" | "contacts" | "notifications" | "operators" | "overview" | "profile" | "requests" | "settings";

const TopbarIcon = ({ name }: { name: "chevron" | "shield" }) => {
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
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const notifications = useNotifications(isAdmin);
  useRealtimeEvents(true);

  useEffect(() => {
    let active = true;
    const refreshContactCount = () => {
      setSidebarContactCount(initialContactCount);
      void listContacts(1).then((page) => {
        if (active) setSidebarContactCount(page.meta.total);
      }).catch(() => undefined);
    };
    refreshContactCount();
    window.addEventListener("realtime:contact-created", refreshContactCount);
    window.addEventListener("realtime:connected", refreshContactCount);
    window.addEventListener("realtime:recovery", refreshContactCount);
    return () => {
      active = false;
      window.removeEventListener("realtime:contact-created", refreshContactCount);
      window.removeEventListener("realtime:connected", refreshContactCount);
      window.removeEventListener("realtime:recovery", refreshContactCount);
    };
  }, [initialContactCount]);

  useEffect(() => {
    if (!isAdmin) return;
    let active = true;
    const refreshPendingRequests = () => {
      void listPendingRequests(1).then((page) => {
        if (active) setPendingRequestCount(page.meta.total);
      }).catch(() => undefined);
    };
    refreshPendingRequests();
    window.addEventListener("realtime:registration-requested", refreshPendingRequests);
    window.addEventListener("requests:changed", refreshPendingRequests);
    window.addEventListener("realtime:connected", refreshPendingRequests);
    window.addEventListener("realtime:recovery", refreshPendingRequests);
    return () => {
      active = false;
      window.removeEventListener("realtime:registration-requested", refreshPendingRequests);
      window.removeEventListener("requests:changed", refreshPendingRequests);
      window.removeEventListener("realtime:connected", refreshPendingRequests);
      window.removeEventListener("realtime:recovery", refreshPendingRequests);
    };
  }, [isAdmin]);

  return <div className="app-shell">
    <aside className="sidebar">
      <Brand />
      <nav>
        <a className={`nav-link ${activeSection === "overview" ? "active" : ""}`} href="#overview">Dashboard</a>
        <a className={`nav-link ${activeSection === "contacts" ? "active" : ""}`} href="#contacts">Contatos {sidebarContactCount !== undefined && <span className="nav-badge">{sidebarContactCount}</span>}</a>
        {isAdmin && <>
          <a className={`nav-link ${activeSection === "requests" ? "active" : ""}`} href="#requests">Solicitações {pendingRequestCount > 0 && <span className="nav-badge nav-badge-notifications">{pendingRequestCount > 99 ? "99+" : pendingRequestCount}</span>}</a>
          <a className={`nav-link ${activeSection === "operators" ? "active" : ""}`} href="#operators">Operadores</a>
          <a className={`nav-link ${activeSection === "notifications" ? "active" : ""}`} href="#notifications">Notificações {notifications.unread > 0 && <span className="nav-badge nav-badge-notifications">{notifications.unread > 99 ? "99+" : notifications.unread}</span>}</a>
          <a className={`nav-link ${activeSection === "audit" ? "active" : ""}`} href="#audit">Auditoria</a>
        </>}
        <a className={`nav-link ${activeSection === "settings" ? "active" : ""}`} href="#settings">Configurações</a>
      </nav>
      <button className="nav-link logout-link" onClick={onLogout}>Sair</button>
    </aside>
    <main className="content">
      <header className="topbar">
        <div className="topbar-actions">
          <span className={`role-chip ${isAdmin ? "" : "operator"}`}><TopbarIcon name="shield" />{isAdmin ? "Administrador" : "Operador"}</span>
          {isAdmin && <NotificationBell isLoading={notifications.isLoading} items={notifications.items} onMarkRead={notifications.markRead} unread={notifications.unread} />}
          <button className="topbar-profile" type="button" aria-expanded={isProfileOpen} aria-haspopup="menu" onClick={() => setIsProfileOpen((current) => !current)}>
            <span className="avatar">{user.name.slice(0, 2).toUpperCase()}</span>
            <span className="topbar-profile-meta"><strong>{user.name}</strong><small>{isAdmin ? "Administrador" : "Operador"}</small></span>
            <TopbarIcon name="chevron" />
          </button>
          {isProfileOpen && <div className="profile-menu" role="menu"><div className="profile-menu-user"><strong>{user.name}</strong><small>{user.email}</small></div><a href="#profile" onClick={() => setIsProfileOpen(false)}>Meu perfil</a><a href="#settings" onClick={() => setIsProfileOpen(false)}>Configurações</a><button type="button" onClick={onLogout}>Sair</button></div>}
        </div>
      </header>
      {children}
    </main>
  </div>;
};
