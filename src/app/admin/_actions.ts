"use server";

import { revalidatePath } from "next/cache";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";

import { db } from "~/server/db";
import { type SessionData, sessionOptions, getAdminEmails } from "~/lib/session";

async function requireAdmin() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  if (!session.email || !getAdminEmails().has(session.email.toLowerCase())) {
    throw new Error("Unauthorized");
  }
  return session.email;
}

export async function addUser(formData: FormData) {
  const adminEmail = await requireAdmin();
  const email = (formData.get("email") as string ?? "").trim().toLowerCase();
  if (!email) return;

  await db.allowedEmail.upsert({
    where: { email },
    create: { email, addedBy: adminEmail },
    update: {},
  });

  revalidatePath("/admin");
}

export async function removeUser(formData: FormData) {
  await requireAdmin();
  const email = formData.get("email") as string;
  if (!email) return;

  await db.allowedEmail.delete({ where: { email } });
  revalidatePath("/admin");
}
