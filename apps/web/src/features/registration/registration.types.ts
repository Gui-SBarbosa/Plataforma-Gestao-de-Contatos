export type RegistrationStatus = "PENDING" | "ACTIVE" | "REJECTED";

export type RegistrationStatusData = {
  decidedAt: string | null;
  status: RegistrationStatus;
};

export type RegistrationInput = {
  email: string;
  name: string;
  password: string;
};
