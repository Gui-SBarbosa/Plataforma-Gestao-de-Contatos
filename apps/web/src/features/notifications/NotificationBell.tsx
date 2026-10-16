import { useState } from "react";

import { useNotifications } from "./useNotifications";

const BellIcon = () => <svg className="topbar-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>;

export const NotificationBell = ({ enabled }: { enabled: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isLoading, items, markRead, unread } = useNotifications(enabled);

  if (!enabled) return null;

  return <div className="notification-bell-wrap">
    <button className="topbar-icon-button topbar-bell" type="button" aria-expanded={isOpen} aria-haspopup="menu" aria-label={`Notificações, ${unread} não lidas`} onClick={() => setIsOpen((current) => !current)}><BellIcon />{unread > 0 && <span className="notification-count">{unread > 99 ? "99+" : unread}</span>}</button>
    {isOpen && <section className="notification-menu" role="menu" aria-label="Notificações">
      <header><div><strong>Notificações</strong><small>{unread ? `${unread} não lida${unread === 1 ? "" : "s"}` : "Tudo em dia"}</small></div></header>
      {isLoading && <p className="notification-empty">Carregando notificações…</p>}
      {!isLoading && items.length === 0 && <p className="notification-empty">Nenhuma notificação até agora.</p>}
      {!isLoading && items.map((notification) => <button className={`notification-row ${notification.readAt ? "" : "unread"}`} key={notification.id} type="button" onClick={() => void markRead(notification.id)}><span className="notification-row-icon"><BellIcon /></span><span><strong>{notification.title}</strong><small>{notification.message}</small><time dateTime={notification.createdAt}>{new Date(notification.createdAt).toLocaleString("pt-BR")}</time></span></button>)}
    </section>}
  </div>;
};
