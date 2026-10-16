import { useCallback, useEffect, useState } from "react";

import { AppShell } from "../../components/layout/AppShell";
import { EmptyState } from "../../components/ui/EmptyState";
import { PaginationControls } from "../../components/ui/PaginationControls";
import { logout } from "../auth/auth.api";
import type { AuthUser } from "../auth/auth.types";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "./notifications.api";
import { NotificationMessage } from "./NotificationMessage";
import type { NotificationItem, NotificationPage } from "./notifications.types";

const CheckIcon = () => <svg className="notification-check-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4.2 4.2L19 6.5" /></svg>;

export const NotificationsPage = ({ user, onLogout }: { user: AuthUser; onLogout: () => void }) => {
  const [page, setPage] = useState<NotificationPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [selected, setSelected] = useState<NotificationItem | null>(null);

  const signOut = async () => {
    try {
      await logout();
    } finally {
      onLogout();
    }
  };

  const load = useCallback(async (nextPage = 1) => {
    setIsLoading(true);
    try {
      setPage(await listNotifications(nextPage, 10));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const openNotification = async (notification: NotificationItem) => {
    setSelected(notification);
    if (notification.readAt) return;
    await markNotificationRead(notification.id);
    setPage((current) => current && {
      ...current,
      data: current.data.map((item) => item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item),
      meta: { ...current.meta, unread: Math.max(0, current.meta.unread - 1) },
    });
    setSelected((current) => current?.id === notification.id ? { ...current, readAt: new Date().toISOString() } : current);
    window.dispatchEvent(new Event("notifications:changed"));
  };

  const markAllRead = async () => {
    if (!page?.meta.unread) return;
    setIsMarkingAll(true);
    try {
      await markAllNotificationsRead();
      setPage((current) => current && {
        ...current,
        data: current.data.map((item) => item.readAt ? item : { ...item, readAt: new Date().toISOString() }),
        meta: { ...current.meta, unread: 0 },
      });
      window.dispatchEvent(new Event("notifications:changed"));
    } finally {
      setIsMarkingAll(false);
    }
  };

  return <AppShell activeSection="notifications" breadcrumb="Administração / Notificações" onLogout={() => void signOut()} title="Notificações" user={user}>
    <section className="content-head notifications-page-head">
      <div><p className="eyebrow">Central de notificações</p><h2>Notificações</h2><p className="muted">Acompanhe os novos cadastros e as atualizações da operação.</p></div>
      <button className="button button-secondary notification-mark-all" disabled={!page?.meta.unread || isMarkingAll} onClick={() => void markAllRead()}><CheckIcon />{isMarkingAll ? "Marcando…" : "Marcar todas como lidas"}</button>
    </section>
    <section className="card notifications-card">
      {isLoading ? <EmptyState>Carregando notificações…</EmptyState> : !page || page.data.length === 0 ? <EmptyState><strong>Nenhuma notificação por enquanto</strong><span>Novas atividades aparecerão aqui.</span></EmptyState> : <>
        <div className="notifications-list">
          {page.data.map((notification) => <button className={`notification-list-row ${notification.readAt ? "" : "unread"}`} key={notification.id} onClick={() => void openNotification(notification)} type="button">
            <span className="notification-status-dot" aria-label={notification.readAt ? "Lida" : "Não lida"} />
            <span className="notification-list-copy"><strong className="notification-title">{notification.title}</strong><NotificationMessage notification={notification} /><time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString("pt-BR")}</time></span>
          </button>)}
        </div>
        {page.meta.totalPages > 1 && <PaginationControls isLoading={isLoading} onNext={() => void load(page.meta.page + 1)} onPrevious={() => void load(page.meta.page - 1)} page={page.meta.page} totalPages={page.meta.totalPages} />}
      </>}
    </section>
    {selected && <div className="overlay" onMouseDown={() => setSelected(null)}><article aria-modal="true" className="modal notification-detail" onMouseDown={(event) => event.stopPropagation()} role="dialog"><div className="modal-head"><div><p className="eyebrow">Notificação</p><h2 className="notification-title">{selected.title}</h2></div><button className="close-button" onClick={() => setSelected(null)} type="button" aria-label="Fechar">×</button></div><div className="notification-detail-body"><NotificationMessage notification={selected} /><time dateTime={selected.createdAt}>{new Date(selected.createdAt).toLocaleString("pt-BR")}</time></div></article></div>}
  </AppShell>;
};
