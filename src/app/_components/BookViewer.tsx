"use client";

import Image from "next/image";
import { useState } from "react";

interface Page {
  pageNumber: number;
  narrative: string;
  illustrationUrl: string | null;
}

interface BookViewerProps {
  pages: Page[];
}

export function BookViewer({ pages }: BookViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);

  if (!pages.length) return <p>No pages found.</p>;

  const page = pages[currentPage]!;

  return (
    <div>
      <p style={{ color: "#888", marginBottom: 8 }}>
        Page {currentPage + 1} of {pages.length}
      </p>

      {/* Book spread: left = narrative, right = illustration */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 32,
          border: "1px solid #ccc",
          padding: 32,
          minHeight: 400,
          background: "#fffdf7",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <p style={{ fontSize: 20, lineHeight: 1.7 }}>{page.narrative}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {page.illustrationUrl ? (
            <Image
              src={page.illustrationUrl}
              alt={`Illustration for page ${page.pageNumber}`}
              width={480}
              height={360}
              style={{ maxWidth: "100%", height: "auto", objectFit: "contain" }}
            />
          ) : (
            <p style={{ color: "#aaa" }}>Illustration not available</p>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <button
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
        >
          ← Previous
        </button>
        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === pages.length - 1}
        >
          Next →
        </button>
      </div>

      {/* Placeholder actions */}
      <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
        <button disabled title="Coming soon">Download PDF</button>
        <button disabled title="Coming soon">Order physical book</button>
      </div>
    </div>
  );
}
