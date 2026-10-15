import { getCsrfToken, request } from "../../services/http";
import type { OperatorInput } from "./admin-users.types";

export const createOperator = async (input: OperatorInput) => {
  const csrfToken = await getCsrfToken();
  const response = await request<{ data: { user: { email: string; id: string; name: string } } }>("/api/admin/users", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    method: "POST",
  });
  return response.data.user;
};
