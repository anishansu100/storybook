"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { api } from "~/trpc/react";

export function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [tripContext, setTripContext] = useState("");
  const [status, setStatus] = useState<
    "idle" | "uploading" | "generating" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const createStory = api.story.create.useMutation({
    onSuccess: ({ storyId }) => router.push(`/story/${storyId}`),
    onError: (err) => {
      setError(err.message);
      setStatus("error");
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setSelectedFiles(files);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFiles.length) return;

    setStatus("uploading");
    setError(null);

    try {
      const formData = new FormData();
      for (const file of selectedFiles) formData.append("files", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }

      const { urls } = (await res.json()) as { urls: string[] };

      setStatus("generating");
      createStory.mutate({ imageUrls: urls, tripContext: tripContext || undefined });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const isLoading = status === "uploading" || status === "generating";

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 480 }}>
      <div>
        <label htmlFor="files"><strong>Trip photos</strong></label>
        <br />
        <input
          id="files"
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={isLoading}
        />
        {selectedFiles.length > 0 && (
          <p style={{ fontSize: 14, color: "#555" }}>{selectedFiles.length} photo(s) selected</p>
        )}
      </div>

      <div>
        <label htmlFor="context"><strong>Trip context</strong> (optional)</label>
        <br />
        <textarea
          id="context"
          value={tripContext}
          onChange={(e) => setTripContext(e.target.value)}
          placeholder="e.g. We visited Yellowstone and saw bears and geysers. Our kids are Emma (5) and Jake (3)."
          rows={4}
          maxLength={500}
          disabled={isLoading}
          style={{ width: "100%" }}
        />
      </div>

      {status === "uploading" && <p>Uploading photos...</p>}
      {status === "generating" && (
        <p>Generating your storybook... this takes about 60–90 seconds.</p>
      )}
      {status === "error" && <p style={{ color: "red" }}>Error: {error}</p>}

      <button type="submit" disabled={isLoading || !selectedFiles.length}>
        {isLoading ? "Working..." : "Create storybook"}
      </button>
    </form>
  );
}
