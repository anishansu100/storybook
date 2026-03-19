import { notFound } from "next/navigation";
import { BookViewer } from "~/app/_components/BookViewer";
import { api } from "~/trpc/server";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await api.story.getById({ id });

  if (!story) notFound();

  if (story.status === "FAILED") {
    return (
      <main style={{ padding: 32 }}>
        <h1>Something went wrong</h1>
        <p>We couldn&apos;t generate your storybook. Please try again.</p>
        <a href="/create">← Try again</a>
      </main>
    );
  }

  return (
    <main style={{ padding: 32 }}>
      <a href="/create" style={{ fontSize: 14 }}>← Create another</a>
      <h1 style={{ marginTop: 8 }}>Your storybook</h1>
      <BookViewer pages={story.pages} />
    </main>
  );
}
