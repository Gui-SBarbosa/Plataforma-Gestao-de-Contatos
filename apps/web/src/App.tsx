import { useEffect, useState } from "react";

import { getCurrentUser } from "./features/auth/auth.api";
import { LoginPage } from "./features/auth/LoginPage";
import type { AuthUser } from "./features/auth/auth.types";
import { ContactsPage } from "./features/contacts/ContactsPage";

export const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  useEffect(() => { void getCurrentUser().then(setUser).catch(() => undefined).finally(() => setIsCheckingSession(false)); }, []);
  if (isCheckingSession) return <div className="screen-loader">Carregando GestCon…</div>;
  return user ? <ContactsPage user={user} onLogout={() => setUser(null)} /> : <LoginPage onAuthenticated={setUser} />;
};
