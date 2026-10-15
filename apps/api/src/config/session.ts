import session from "express-session";

import { env } from "./env.js";
import { PrismaSessionStore } from "./session-store.js";

export const createSessionMiddleware = () =>
  session({
    cookie: {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
    },
    name: "gestcon.sid",
    resave: false,
    saveUninitialized: false,
    secret: env.SESSION_SECRET,
    store: new PrismaSessionStore(),
  });
