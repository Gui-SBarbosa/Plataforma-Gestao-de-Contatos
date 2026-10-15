import { getCsrfToken, request } from "../../services/http";
import type { PendingRequest, PendingRequestPage } from "./admin-requests.types";

export const listPendingRequests = (page = 1) => request<PendingRequestPage>(`/api/admin/users?page=${page}&pageSize=10&status=PENDING`);

const decideRequest = async (id: string, decision: "approve" | "reject") => {
  const csrfToken = await getCsrfToken();
  const response = await request<{ data: { user: PendingRequest } }>(`/api/admin/users/${id}/${decision}`, {
    headers: { "X-CSRF-Token": csrfToken },
    method: "PATCH",
  });
  return response.data.user;
};

export const approveRequest = (id: string) => decideRequest(id, "approve");
export const rejectRequest = (id: string) => decideRequest(id, "reject");
