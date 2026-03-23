"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "~/trpc/react";

const GENERATING_MESSAGES = [
  "Uploading your magical memories...",
  "Identifying your characters...",
  "Crafting your story narrative...",
  "Generating illustrations...",
  "Finishing your storybook...",
];

export function UploadForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [tripContext, setTripContext] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [convertingIndexes, setConvertingIndexes] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<
    "idle" | "generating" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const createStory = api.story.create.useMutation({
    onSuccess: ({ storyId }) => router.push(`/story/${storyId}`),
    onError: (err) => {
      setError(err.message);
      setStatus("error");
    },
  });

  // Manage object URL previews, converting HEIC to JPEG for display
  useEffect(() => {
    const urls: string[] = [];
    let cancelled = false;

    async function buildPreviews() {
      const heic2any = (await import("heic2any")).default;
      const converting = new Set<number>();
      files.forEach((f, i) => {
        if (/\.(heic|heif)$/i.test(f.name) || f.type === "image/heic" || f.type === "image/heif") {
          converting.add(i);
        }
      });
      if (!cancelled) setConvertingIndexes(converting);

      const results = await Promise.all(
        files.map(async (f, i) => {
          if (converting.has(i)) {
            const blob = await heic2any({ blob: f, toType: "image/jpeg", quality: 0.7 }) as Blob;
            if (!cancelled) setConvertingIndexes((prev) => { const next = new Set(prev); next.delete(i); return next; });
            return URL.createObjectURL(blob);
          }
          return URL.createObjectURL(f);
        }),
      );
      if (!cancelled) {
        urls.push(...results);
        setPreviews(results);
      }
    }

    void buildPreviews();
    return () => {
      cancelled = true;
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [files]);

  // Animate progress + messages while generating
  useEffect(() => {
    if (status !== "generating") return;
    setProgress(0);
    setMessageIndex(0);

    const progressInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 98) return 98;
        // Fast start (upload), medium middle (char extraction + illustrations), slow crawl near end
        const rate =
          p < 15 ? 3 + Math.random() * 4
          : p < 45 ? 0.8 + Math.random() * 1.2
          : p < 80 ? 0.3 + Math.random() * 0.7
          : 0.08 + Math.random() * 0.12;
        return Math.min(98, p + rate);
      });
    }, 800);

    const messageInterval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % GENERATING_MESSAGES.length);
    }, 3000);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
    };
  }, [status]);

  function addFiles(incoming: File[]) {
    const images = incoming.filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...images]);
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave() {
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!files.length) return;

    setStatus("generating");
    setError(null);

    try {
      const formData = new FormData();
      for (const file of files) formData.append("files", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error ?? "Upload failed");
      }

      const { urls } = (await res.json()) as { urls: string[] };

      setStatus("generating");
      createStory.mutate({
        imageUrls: urls,
        tripContext: tripContext || undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  }

  const isLoading = status === "generating";

  return (
    <>
      {/* Full-screen generating overlay */}
      <AnimatePresence>
        {(status === "generating" || status === "error") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 bg-background/95 backdrop-blur-sm"
          >
            {status === "error" ? (
              <div className="flex flex-col items-center gap-6 text-center max-w-md">
                <div className="text-6xl select-none">😔</div>
                <h2 className="text-4xl font-bold">Something went wrong</h2>
                <p className="text-muted-foreground text-lg">{error}</p>
                <button
                  onClick={() => setStatus("idle")}
                  className="rounded-full px-8 py-4 text-lg font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="mb-12 text-8xl select-none"
                >
                  ✨
                </motion.div>

                <h2 className="text-4xl font-bold mb-6 text-center">
                  Creating Your Storybook
                </h2>

                <p className="text-muted-foreground text-lg mb-12 text-center max-w-md h-8">
                  {GENERATING_MESSAGES[messageIndex]}
                </p>

                <div className="w-full max-w-md mb-4">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background:
                          "linear-gradient(to right, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)))",
                      }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    {Math.round(progress)}%
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">
                  Typical wait time: 2–3 minutes
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6 py-8">
        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 text-center ${
            isDragging
              ? "border-primary bg-primary/10 scale-[1.02]"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/20"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileInput}
            disabled={isLoading}
          />
          <div className="flex flex-col items-center gap-4 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              Drop your trip photos here
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Or click to browse. We support JPG, PNG, and HEIC.
            </p>
          </div>
        </div>

        {/* Thumbnails + actions */}
        <AnimatePresence>
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Thumbnail grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {files.map((_, idx) => (
                  <motion.div
                    key={idx}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
                  >
                    {convertingIndexes.has(idx) ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-muted/50">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                          className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full"
                        />
                        <span className="text-xs text-muted-foreground">Converting…</span>
                      </div>
                    ) : previews[idx] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previews[idx]}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeFile(idx)}
                      disabled={isLoading}
                      className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 disabled:hidden"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
                {/* Add more tile */}
                <div className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center text-muted-foreground hover:bg-muted/10 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileInput}
                    disabled={isLoading}
                  />
                  <span className="text-2xl pointer-events-none">+</span>
                </div>
              </div>

              {/* Trip context */}
              <div className="space-y-2">
                <label
                  htmlFor="context"
                  className="text-sm font-semibold text-foreground"
                >
                  Trip context{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="context"
                  value={tripContext}
                  onChange={(e) => setTripContext(e.target.value)}
                  placeholder="e.g. We visited Yellowstone and saw bears and geysers. Our kids are Emma (5) and Jake (3)."
                  rows={3}
                  maxLength={500}
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 transition"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !files.length}
                className="w-full rounded-full px-8 py-4 text-lg font-bold bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                Create Magic Story ✨
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </>
  );
}
