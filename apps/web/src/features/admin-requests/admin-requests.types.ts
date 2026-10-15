export type PendingRequest = {
  email: string;
  id: string;
  name: string;
  role: "OPERATOR";
  status: "PENDING";
};

export type PendingRequestPage = {
  data: PendingRequest[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
};
