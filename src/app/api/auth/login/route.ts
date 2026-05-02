import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { db } from "~/server/db";
import { type SessionData, sessionOptions } from "~/lib/session";

export async function POST(request: Request) {
  const body = (await request.json()) as { email?: string };
  const email = (body.email ?? "").trim().toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const allowed = await db.allowedEmail.findUnique({ where: { email } });
  if (!allowed) {
    return NextResponse.json({ error: "Not on guest list" }, { status: 403 });
  }

  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  session.email = email;
  await session.save();

  await db.accessLog.create({
    data: { email, action: "login" },
  });

  return NextResponse.json({ ok: true });
}
