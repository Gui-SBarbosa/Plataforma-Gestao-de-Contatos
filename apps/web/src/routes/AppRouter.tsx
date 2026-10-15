import { AdminRequestsPage } from "../features/admin-requests/AdminRequestsPage";
import { AdminUsersPage } from "../features/admin-users/AdminUsersPage";
import { LoginPage } from "../features/auth/LoginPage";
import type { AuthUser } from "../features/auth/auth.types";
import { ContactsPage } from "../features/contacts/ContactsPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { RegistrationTrackingPage } from "../features/registration/RegistrationTrackingPage";

type AppRouterProps = { onAuthenticated: (user: AuthUser) => void; onLogout: () => void; route: string; user: AuthUser | null };

export const AppRouter = ({ onAuthenticated, onLogout, route, user }: AppRouterProps) => {
  if (!user && route === "#register") return <RegistrationTrackingPage />;
  if (!user) return <LoginPage onAuthenticated={onAuthenticated} />;
  if (route === "#overview") return <DashboardPage user={user} onLogout={onLogout} />;
  if (user.role === "ADMIN" && route === "#operators") return <AdminUsersPage user={user} onLogout={onLogout} />;
  if (user.role === "ADMIN" && route === "#requests") return <AdminRequestsPage user={user} onLogout={onLogout} />;
  return <ContactsPage user={user} onLogout={onLogout} />;
};
