import type { RegistrationInput, RegistrationStatusData } from "./registration.types";

type ApiErrorPayload = { error?: { message?: string } };

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, { credentials: "include", ...init });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
    throw new Error(payload.error?.message ?? "Não foi possível processar a solicitação.");
  }

  return response.json() as Promise<T>;
};

const getCsrfToken = async () => {
  const response = await request<{ data: { csrfToken: string } }>("/api/auth/csrf");

  return response.data.csrfToken;
};

export const createRegistration = async (input: RegistrationInput) => {
  const csrfToken = await getCsrfToken();
  const response = await request<{ data: { trackingToken: string } }>("/api/auth/register", {
    body: JSON.stringify(input),
    headers: { "Content-Type": "application/json", "X-CSRF-Token": csrfToken },
    method: "POST",
  });

  return response.data.trackingToken;
};

export const getRegistrationStatus = async (trackingToken: string) => {
  const query = new URLSearchParams({ trackingToken });
  const response = await request<{ data: RegistrationStatusData }>(`/api/auth/registration-status?${query.toString()}`);

  return response.data;
};
