"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });

    if (res.ok) {
      const from = searchParams.get("from") ?? "/";
      router.replace(from);
    } else {
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl">📚</span>
          <h1
            className="text-2xl font-bold text-primary mt-3"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            TripTales
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Enter your email to continue
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border rounded-2xl shadow-sm p-8 space-y-4"
        >
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-foreground mb-1.5"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setStatus("idle");
              }}
              placeholder="you@example.com"
              className="w-full px-4 py-3 rounded-xl border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
            />
          </div>

          {status === "error" && (
            <p className="text-sm text-destructive font-medium">
              This email isn&apos;t on the guest list.
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground shadow-md hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Checking..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
