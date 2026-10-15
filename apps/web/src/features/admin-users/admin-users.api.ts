import { getCsrfToken, request } from "../../services/http";
import type { Operator, OperatorInput, OperatorPage } from "./admin-users.types";

export const listOperators = (page = 1) => request<OperatorPage>(`/api/admin/users/operators?page=${page}&pageSize=10`);

export const createOperator = async (input: OperatorInput) => {
  const csrfToken = await getCsrfToken();
  const response = await request<{ data: { user: { email: string; id: string; name: string } } }>("/api/admin/users", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    method: "POST",
  });
  return response.data.user;
};

const mutateOperator = async (path: string, init: RequestInit = {}) => {
  const csrfToken = await getCsrfToken();
  const response = await request<{ data: { user: Operator } }>(path, { ...init, headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken, ...init.headers } });
  return response.data.user;
};

export const updateOperator = (id: string, input: Pick<OperatorInput, "email" | "name">) => mutateOperator(`/api/admin/users/${id}`, { body: JSON.stringify(input), method: "PATCH" });
export const deactivateOperator = (id: string) => mutateOperator(`/api/admin/users/${id}`, { method: "DELETE" });
export const activateOperator = (id: string) => mutateOperator(`/api/admin/users/${id}/activate`, { method: "PATCH" });
