import { type SessionOptions } from "iron-session";

export interface SessionData {
  email: string;
}

export const sessionOptions: SessionOptions = {
  cookieName: "triptales-session",
  password: process.env.SESSION_SECRET!,
  ttl: 60 * 60 * 24 * 7, // 7 days
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
  },
};

export function getAdminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  );
}
