import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Storybook</h1>
      <p>Turn your family trip photos into a children&apos;s storybook.</p>
      <Link href="/create">
        <button style={{ marginTop: 16 }}>Create a storybook →</button>
      </Link>
    </main>
  );
}
