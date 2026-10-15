import { request } from "../../services/http";

export type DashboardData = {
  availableOperators: { id: string; name: string }[];
  byOperator: { id: string; name: string; total: number }[];
  bySource: { source: string; total: number }[];
  interval: string;
  series: { period: string; total: number }[];
  summary: { contacts: number };
};

export const getDashboard = (params: URLSearchParams) =>
  request<{ data: DashboardData }>(`/api/dashboard?${params.toString()}`);
