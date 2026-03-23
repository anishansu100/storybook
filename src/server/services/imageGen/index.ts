import { fluxStrategy } from "./flux";
import { gpt4oStrategy } from "./gpt4o";
import type { ImageGenStrategy } from "./types";

// gpt4o: primary strategy — gpt-image-1 with character reference images (requires OPENAI_API_KEY)
// flux:  fallback strategy — Flux Schnell text-to-image (requires FAL_API_KEY)
// Set IMAGE_GEN_STRATEGY env var to override; default is gpt4o
const strategy = process.env.IMAGE_GEN_STRATEGY ?? "gpt4o";

const strategies: Record<string, ImageGenStrategy> = {
  flux: fluxStrategy,
  gpt4o: gpt4oStrategy,
};

const resolved = strategies[strategy];
if (!resolved) throw new Error(`Unknown IMAGE_GEN_STRATEGY: ${strategy}`);

export const imageGen: ImageGenStrategy = resolved;
