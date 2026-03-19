import { UploadForm } from "~/app/_components/UploadForm";

export default function CreatePage() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Create a storybook</h1>
      <p>Upload photos from your trip and we&apos;ll turn them into a children&apos;s storybook.</p>
      <UploadForm />
    </main>
  );
}
