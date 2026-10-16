import { useEffect, useState } from "react";

import { getCurrentUser } from "./features/auth/auth.api";
import type { AuthUser } from "./features/auth/auth.types";
import { AppRouter } from "./routes/AppRouter";

export const App = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [route, setRoute] = useState(() => window.location.hash);
  useEffect(() => { void getCurrentUser().then(setUser).catch(() => undefined).finally(() => setIsCheckingSession(false)); }, []);
  useEffect(() => { const handleHashChange = () => setRoute(window.location.hash); window.addEventListener("hashchange", handleHashChange); return () => window.removeEventListener("hashchange", handleHashChange); }, []);
  if (isCheckingSession) return <div className="screen-loader">Carregando GestCon…</div>;
  return <AppRouter onAuthenticated={setUser} onLogout={() => setUser(null)} route={route} user={user} />;
};
