export type OperatorInput = { email: string; name: string; password: string };
export type Operator = { createdAt: string; email: string; id: string; name: string; role: "OPERATOR"; status: "ACTIVE" | "DISABLED"; updatedAt: string };
export type OperatorPage = { data: Operator[]; meta: { page: number; pageSize: number; total: number; totalPages: number } };
