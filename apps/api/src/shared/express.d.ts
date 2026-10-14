import type { UserRole, UserStatus } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      authUser?: {
        email: string;
        id: string;
        name: string;
        role: UserRole;
        status: UserStatus;
      };
      id: string;
    }
  }
}

export {};
