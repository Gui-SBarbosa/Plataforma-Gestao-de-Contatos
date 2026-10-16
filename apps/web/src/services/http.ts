export type ApiErrorPayload = { error?: { message?: string } };

export const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(path, { credentials: "include", ...init });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new Error(payload.error?.message ?? "Não foi possível processar a solicitação.");
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
};

export const getCsrfToken = async () => {
  const response = await request<{ data: { csrfToken: string } }>("/api/auth/csrf");
  return response.data.csrfToken;
};
