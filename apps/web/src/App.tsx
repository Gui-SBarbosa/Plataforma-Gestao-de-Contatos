import { useEffect, useState } from "react";

import { getCurrentUser } from "./features/auth/auth.api";
import { LoginPage } from "./features/auth/LoginPage";
import type { AuthUser } from "./features/auth/auth.types";
import { ContactsPage } from "./features/contacts/ContactsPage";
import { AdminUsersPage } from "./features/admin-users/AdminUsersPage";

export const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [route, setRoute] = useState(() => window.location.hash);
  useEffect(() => { void getCurrentUser().then(setUser).catch(() => undefined).finally(() => setIsCheckingSession(false)); }, []);
  useEffect(() => { const handleHashChange = () => setRoute(window.location.hash); window.addEventListener("hashchange", handleHashChange); return () => window.removeEventListener("hashchange", handleHashChange); }, []);
  if (isCheckingSession) return <div className="screen-loader">Carregando GestCon…</div>;
  if (user?.role === "ADMIN" && route === "#operators") return <AdminUsersPage user={user} onLogout={() => setUser(null)} />;
  return user ? <ContactsPage user={user} onLogout={() => setUser(null)} /> : <LoginPage onAuthenticated={setUser} />;
};
