import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "~/server/db";
import { type SessionData, sessionOptions, getAdminEmails } from "~/lib/session";
import { addUser, removeUser } from "./_actions";

export default async function AdminPage() {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions,
  );
  if (!session.email || !getAdminEmails().has(session.email.toLowerCase())) {
    redirect("/login");
  }
  const [allowedEmails, recentLogs] = await Promise.all([
    db.allowedEmail.findMany({ orderBy: { addedAt: "desc" } }),
    db.accessLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  // Build per-email stats from logs
  const lastSeen = new Map<string, Date>();
  const loginCount = new Map<string, number>();
  const storyCount = new Map<string, number>();

  for (const log of recentLogs) {
    if (log.action === "login") {
      loginCount.set(log.email, (loginCount.get(log.email) ?? 0) + 1);
      if (!lastSeen.has(log.email)) lastSeen.set(log.email, log.createdAt);
    }
    if (log.action === "story_created") {
      storyCount.set(log.email, (storyCount.get(log.email) ?? 0) + 1);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
      <div>
        <h1
          className="text-2xl font-bold text-primary"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage who can access TripTales
        </p>
      </div>

      {/* Add user */}
      <section className="bg-card border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Add a guest</h2>
        <form action={addUser} className="flex gap-3">
          <input
            name="email"
            type="email"
            required
            placeholder="guest@example.com"
            className="flex-1 px-4 py-2.5 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:opacity-90 transition-all shadow-sm"
          >
            Add
          </button>
        </form>
      </section>

      {/* Guest list */}
      <section className="bg-card border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">
          Guests{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({allowedEmails.length})
          </span>
        </h2>
        {allowedEmails.length === 0 ? (
          <p className="text-muted-foreground text-sm">No guests yet.</p>
        ) : (
          <div className="divide-y">
            {allowedEmails.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between py-3 gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{entry.email}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Added {entry.addedAt.toLocaleDateString()} by {entry.addedBy}
                    {lastSeen.has(entry.email) && (
                      <>
                        {" · "}Last seen{" "}
                        {lastSeen.get(entry.email)!.toLocaleDateString()}
                      </>
                    )}
                    {storyCount.has(entry.email) && (
                      <>
                        {" · "}
                        {storyCount.get(entry.email)} stor
                        {storyCount.get(entry.email) === 1 ? "y" : "ies"}
                      </>
                    )}
                  </p>
                </div>
                <form action={removeUser}>
                  <input type="hidden" name="email" value={entry.email} />
                  <button
                    type="submit"
                    className="text-xs text-destructive hover:underline whitespace-nowrap"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Activity feed */}
      <section className="bg-card border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Recent activity</h2>
        {recentLogs.length === 0 ? (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        ) : (
          <div className="divide-y">
            {recentLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 py-2.5">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    log.action === "login"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {log.action === "login" ? "login" : "story"}
                </span>
                <span className="text-sm flex-1 truncate">{log.email}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {log.createdAt.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
