import type { Server as HttpServer } from "node:http";

import { UserRole } from "@prisma/client";
import type { RequestHandler } from "express";
import { Server } from "socket.io";

import { env } from "../config/env.js";
import { consumeRateLimit } from "../modules/rate-limit/rate-limit.service.js";
import { registrationTrackingSchema } from "../modules/registration/registration.schema.js";
import { findRegistrationByTrackingToken } from "../modules/registration/registration.service.js";
import { getActiveUser } from "../modules/auth/auth.service.js";

type RegistrationDecision = {
  decidedAt: Date;
  registrationId: string;
  status: "ACTIVE" | "REJECTED";
};

type ContactCreated = {
  contactId: string;
  createdAt: Date;
  creatorName: string;
};

type RegistrationRequested = {
  createdAt: Date;
  registrationId: string;
  requesterName: string;
};

type RegistrationWatchAcknowledgement = (response: { code?: string; data?: { decidedAt: Date | null; status: string }; ok: boolean }) => void;

const registrationRoom = (registrationId: string) => `registration:${registrationId}`;
const adminRoom = "admins";

export const createRegistrationRealtime = (httpServer: HttpServer, sessionMiddleware?: RequestHandler) => {
  const io = new Server(httpServer, {
    cors: { credentials: true, origin: env.APP_ORIGIN },
    allowRequest: (request, callback) => callback(null, request.headers.origin === env.APP_ORIGIN),
  });

  io.use((socket, next) => {
    if (!sessionMiddleware) {
      next();
      return;
    }

    sessionMiddleware(socket.request as Parameters<RequestHandler>[0], {} as Parameters<RequestHandler>[1], (error) => {
      if (error) {
        next(error);
        return;
      }

      const userId = (socket.request as unknown as { session?: { userId?: string } }).session?.userId;

      if (!userId) {
        next();
        return;
      }

      void getActiveUser(userId)
        .then((user) => {
          if (user?.role === UserRole.ADMIN) {
            socket.join(adminRoom);
          }

          next();
        })
        .catch((sessionError: unknown) => next(sessionError instanceof Error ? sessionError : new Error("Unable to validate session.")));
    });
  });

  io.on("connection", (socket) => {
    socket.on("registration:watch", async (payload: unknown, acknowledge: RegistrationWatchAcknowledgement) => {
      const input = registrationTrackingSchema.safeParse(payload);

      if (!input.success) {
        acknowledge({ code: "INVALID_TRACKING_TOKEN", ok: false });
        return;
      }

      try {
        const rateLimit = await consumeRateLimit("REGISTRATION_STATUS", input.data.trackingToken);

        if (rateLimit.exceeded) {
          acknowledge({ code: "RATE_LIMITED", ok: false });
          return;
        }

        const registration = await findRegistrationByTrackingToken(input.data.trackingToken);

        if (!registration) {
          acknowledge({ code: "REGISTRATION_NOT_FOUND", ok: false });
          return;
        }

        const previousRegistrationId = socket.data.registrationId as string | undefined;

        if (previousRegistrationId) {
          socket.leave(registrationRoom(previousRegistrationId));
        }

        socket.data.registrationId = registration.id;
        socket.join(registrationRoom(registration.id));
        acknowledge({
          data: {
            decidedAt: registration.approvedAt ?? (registration.status === "PENDING" ? null : registration.updatedAt),
            status: registration.status,
          },
          ok: true,
        });
      } catch {
        acknowledge({ code: "REGISTRATION_UNAVAILABLE", ok: false });
      }
    });

    socket.on("registration:unwatch", () => {
      const registrationId = socket.data.registrationId as string | undefined;

      if (registrationId) {
        socket.leave(registrationRoom(registrationId));
        delete socket.data.registrationId;
      }
    });
  });

  return {
    publishRegistrationDecision: ({ decidedAt, registrationId, status }: RegistrationDecision) => {
      const event = status === "ACTIVE" ? "registration:approved" : "registration:rejected";

      io.to(registrationRoom(registrationId)).emit(event, { decidedAt, status });
    },
    publishContactCreated: ({ contactId, createdAt, creatorName }: ContactCreated) => {
      io.to(adminRoom).emit("contact:created", { contactId, createdAt, creatorName });
    },
    publishRegistrationRequested: ({ createdAt, registrationId, requesterName }: RegistrationRequested) => {
      io.to(adminRoom).emit("registration:requested", { createdAt, registrationId, requesterName });
    },
  };
};
