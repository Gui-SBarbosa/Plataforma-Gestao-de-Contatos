import { Prisma } from "@prisma/client";
import session from "express-session";

import { prisma } from "./prisma.js";

const defaultSessionLifetimeMs = 8 * 60 * 60 * 1000;

const getExpiration = (sessionData: session.SessionData) => {
  const expiresAt = sessionData.cookie?.expires;

  return expiresAt instanceof Date ? expiresAt : new Date(Date.now() + defaultSessionLifetimeMs);
};

export class PrismaSessionStore extends session.Store {
  override get(sid: string, callback: (error?: Error | null, session?: session.SessionData | null) => void) {
    void prisma.session
      .findUnique({ where: { sid } })
      .then((storedSession) => {
        if (!storedSession || storedSession.expire <= new Date()) {
          callback(null, null);
          return;
        }

        callback(null, storedSession.sess as unknown as session.SessionData);
      })
      .catch((error: unknown) => callback(error instanceof Error ? error : new Error("Unable to read session.")));
  }

  override set(sid: string, sessionData: session.SessionData, callback?: (error?: Error | null) => void) {
    void prisma.session
      .upsert({
        where: { sid },
        update: { sess: sessionData as unknown as Prisma.InputJsonValue, expire: getExpiration(sessionData) },
        create: { sid, sess: sessionData as unknown as Prisma.InputJsonValue, expire: getExpiration(sessionData) },
      })
      .then(() => callback?.(null))
      .catch((error: unknown) => callback?.(error instanceof Error ? error : new Error("Unable to save session.")));
  }

  override destroy(sid: string, callback?: (error?: Error | null) => void) {
    void prisma.session
      .delete({ where: { sid } })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
          return;
        }

        throw error;
      })
      .then(() => callback?.(null))
      .catch((error: unknown) => callback?.(error instanceof Error ? error : new Error("Unable to destroy session.")));
  }

  override touch(sid: string, sessionData: session.SessionData, callback?: (error?: Error | null) => void) {
    void prisma.session
      .update({ where: { sid }, data: { expire: getExpiration(sessionData) } })
      .then(() => callback?.(null))
      .catch((error: unknown) => callback?.(error instanceof Error ? error : new Error("Unable to refresh session.")));
  }
}
