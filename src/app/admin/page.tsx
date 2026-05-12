import { redirect } from "next/navigation";
import { currentUser, clerkClient } from "@clerk/nextjs/server";
import Link from "next/link";

import { db } from "~/server/db";
import { ADMIN_EMAILS } from "~/config";

export default async function AdminPage() {
  const user = await currentUser();
  const primaryEmail = user?.emailAddresses[0]?.emailAddress?.toLowerCase();

  if (!primaryEmail || !ADMIN_EMAILS.has(primaryEmail)) {
    redirect("/");
  }

  // Fetch all stories from DB
  const stories = await db.story.findMany({
    orderBy: { createdAt: "desc" },
    include: { pages: { select: { id: true } } },
  });

  // Gather unique Clerk user IDs
  const clerkUserIds = [
    ...new Set(stories.map((s) => s.clerkUserId).filter(Boolean) as string[]),
  ];

  // Fetch user details from Clerk
  const clerk = await clerkClient();
  const clerkUsers = clerkUserIds.length
    ? await clerk.users.getUserList({ userId: clerkUserIds, limit: 100 })
    : { data: [] };

  const userMap = new Map(
    clerkUsers.data.map((u) => [
      u.id,
      {
        name:
          [u.firstName, u.lastName].filter(Boolean).join(" ") || "Unnamed",
        email: u.emailAddresses[0]?.emailAddress ?? "—",
        imageUrl: u.imageUrl,
      },
    ]),
  );

  // Per-user story stats
  const statsByUser = new Map<
    string,
    { count: number; lastStory: Date }
  >();
  for (const story of stories) {
    if (!story.clerkUserId) continue;
    const existing = statsByUser.get(story.clerkUserId);
    if (!existing) {
      statsByUser.set(story.clerkUserId, {
        count: 1,
        lastStory: story.createdAt,
      });
    } else {
      existing.count++;
      if (story.createdAt > existing.lastStory)
        existing.lastStory = story.createdAt;
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
          {stories.length} total stor{stories.length === 1 ? "y" : "ies"} across {clerkUserIds.length} user{clerkUserIds.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* Per-user summary */}
      <section className="bg-card border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Users</h2>
        {clerkUserIds.length === 0 ? (
          <p className="text-muted-foreground text-sm">No stories created yet.</p>
        ) : (
          <div className="divide-y">
            {clerkUserIds.map((uid) => {
              const info = userMap.get(uid);
              const stats = statsByUser.get(uid);
              return (
                <div key={uid} className="flex items-center gap-4 py-3">
                  {info?.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={info.imageUrl}
                      alt={info.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{info?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {info?.email}
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <p className="font-semibold text-foreground">
                      {stats?.count ?? 0} stor{stats?.count === 1 ? "y" : "ies"}
                    </p>
                    <p>
                      Last:{" "}
                      {stats?.lastStory.toLocaleDateString() ?? "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent stories feed */}
      <section className="bg-card border rounded-2xl p-6 space-y-4">
        <h2 className="font-bold text-lg">Recent Stories</h2>
        {stories.length === 0 ? (
          <p className="text-muted-foreground text-sm">No stories yet.</p>
        ) : (
          <div className="divide-y">
            {stories.map((story) => {
              const info = story.clerkUserId
                ? userMap.get(story.clerkUserId)
                : null;
              return (
                <div
                  key={story.id}
                  className="flex items-center gap-4 py-3"
                >
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      story.status === "COMPLETE"
                        ? "bg-green-100 text-green-700"
                        : story.status === "FAILED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {story.status.toLowerCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {story.tripContext ?? "No context provided"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {info?.email ?? "unknown user"} ·{" "}
                      {story.pages.length} page{story.pages.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {story.createdAt.toLocaleDateString()}
                    </span>
                    {story.status === "COMPLETE" && (
                      <Link
                        href={`/story/${story.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
