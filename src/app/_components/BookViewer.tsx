"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  ShoppingCart,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

function makeRaggedClipPath(seed: number) {
  const rng = (i: number) => Math.abs(Math.sin(seed * 9301 + i * 49297) % 1);
  const jitter = (i: number) => rng(i) * 2; // max 2% variation
  const pts: string[] = [];
  const steps = 10;
  // Top edge
  for (let i = 0; i <= steps; i++) pts.push(`${(i / steps) * 100}% ${jitter(i)}%`);
  // Right edge
  for (let i = 1; i <= steps; i++) pts.push(`${100 - jitter(steps + i)}% ${(i / steps) * 100}%`);
  // Bottom edge
  for (let i = steps - 1; i >= 0; i--) pts.push(`${(i / steps) * 100}% ${100 - jitter(steps * 2 + i)}%`);
  // Left edge
  for (let i = steps - 1; i >= 1; i--) pts.push(`${jitter(steps * 3 + i)}% ${(i / steps) * 100}%`);
  return `polygon(${pts.join(", ")})`;
}

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
  const [fontSize, setFontSize] = useState(1.4); // rem
  const [textColor, setTextColor] = useState("#1a1a1a");

  const clipPaths = useMemo(
    () => pages.map((_, i) => makeRaggedClipPath(i + 1)),
    [pages],
  );

  if (!pages.length)
    return <p className="text-base text-muted-foreground">No pages found.</p>;

  const page = pages[currentPage]!;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-4xl mx-auto">
      {/* Book spread */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[2/1] bg-[#fdfbf7] rounded-sm shadow-2xl flex overflow-hidden border border-[#e3dcd2]">
        {/* Binding shadow */}
        <div className="absolute inset-y-0 left-1/2 w-8 -ml-4 bg-gradient-to-r from-transparent via-black/5 to-transparent z-20 pointer-events-none mix-blend-multiply" />

        {/* Left page — narrative */}
        <div className="w-1/2 px-6 py-8 flex flex-col justify-center items-center relative bg-[#fdfbf7]">
          <div className="absolute bottom-6 left-8">
            <span className="text-muted-foreground/40 text-xs font-mono">{currentPage + 1}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.p
              key={`text-${currentPage}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="leading-relaxed text-center text-foreground/80 overflow-y-auto max-h-full"
              style={{ fontFamily: "var(--font-heading)", fontSize: `${fontSize}rem`, color: textColor }}
            >
              {page.narrative}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Right page — illustration */}
        <div className="w-1/2 bg-white flex items-center justify-center relative">
          <div className="absolute bottom-6 right-8 text-muted-foreground/40 text-xs font-mono z-10">
            {currentPage + 1}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`img-${currentPage}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 flex items-center justify-center p-4"
            >
              {page.illustrationUrl ? (
                <div className="relative w-full aspect-[4/3]" style={{ clipPath: clipPaths[currentPage] }}>
                  <Image
                    src={page.illustrationUrl}
                    alt={`Illustration for page ${page.pageNumber}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground/40 text-sm">Illustration not available</span>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1">
          <button onClick={() => setFontSize((s) => Math.max(0.7, s - 0.1))} title="Decrease text size" className="text-muted-foreground/50 hover:text-foreground leading-none hover:bg-black/5 rounded px-1 transition-colors" style={{ fontSize: "0.55rem" }}>A</button>
          <button onClick={() => setFontSize((s) => Math.min(5, s + 0.1))} title="Increase text size" className="text-muted-foreground/50 hover:text-foreground leading-none hover:bg-black/5 rounded px-1 transition-colors" style={{ fontSize: "1rem" }}>A</button>
        </div>
        <button
          onClick={() => setCurrentPage((p) => p - 1)}
          disabled={currentPage === 0}
          className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="font-mono text-sm text-muted-foreground">
          Page {currentPage + 1} of {pages.length}
        </span>
        <button
          onClick={() => setCurrentPage((p) => p + 1)}
          disabled={currentPage === pages.length - 1}
          className="w-12 h-12 rounded-full border border-border flex items-center justify-center hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        <input
          type="color"
          title="Change text color"
          defaultValue="#1a1a1a"
          onChange={(e) => setTextColor(e.target.value)}
          className="cursor-pointer border-0 p-0 overflow-hidden appearance-none [border-radius:50%] [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0"
          style={{ width: "1rem", height: "1rem" }}
        />
      </div>

      {/* Action buttons — Phase 4 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          disabled
          title="Coming soon"
          className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-md bg-secondary text-secondary-foreground shadow-lg opacity-60 cursor-not-allowed"
        >
          <ShoppingCart className="w-5 h-5" />
          Order Hardcover ($29)
        </button>
        <button
          disabled
          title="Coming soon"
          className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-md border border-primary/20 text-foreground opacity-60 cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          Download PDF ($9)
        </button>
        <button
          disabled
          title="Coming soon"
          className="flex items-center gap-2 px-8 py-4 rounded-full font-bold text-md border border-accent/20 text-foreground opacity-60 cursor-not-allowed"
        >
          <BookOpen className="w-5 h-5" />
          Share Story
        </button>
      </div>
    </div>
  );
}
