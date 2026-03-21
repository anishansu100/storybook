import Link from "next/link";
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
      <main className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-8">
          <span className="text-4xl">😔</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Something went wrong</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          We couldn&apos;t generate your storybook. Please try again.
        </p>
        <Link
          href="/"
          className="flex items-center gap-2 px-6 py-3 rounded-full border border-border hover:bg-muted/50 transition-colors font-semibold"
        >
          ← Try again
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col">
      <section className="container mx-auto max-w-4xl px-6 pt-10 pb-4">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
        >
          ← Create another
        </Link>
      </section>
      <section className="container mx-auto max-w-4xl px-6 pb-4">
        <h1 className="text-2xl font-bold">Your storybook</h1>
      </section>
      <section className="container mx-auto max-w-4xl px-6 pb-20">
        <BookViewer pages={story.pages} />
      </section>
    </main>
  );
}
