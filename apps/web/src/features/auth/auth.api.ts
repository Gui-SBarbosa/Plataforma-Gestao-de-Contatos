import { getCsrfToken, request } from "../../services/http";
import type { AuthUser } from "./auth.types";

export const login = async (email: string, password: string) => {
  const csrfToken = await getCsrfToken();
  const response = await request<{ data: { user: AuthUser } }>("/api/auth/login", {
    body: JSON.stringify({ email, password }),
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    method: "POST",
  });
  return response.data.user;
};

export const getCurrentUser = () => request<{ data: { user: AuthUser } }>("/api/auth/me").then((response) => response.data.user);

export const logout = async () => {
  const csrfToken = await getCsrfToken();
  await request<void>("/api/auth/logout", { headers: { "X-CSRF-Token": csrfToken }, method: "POST" });
};
