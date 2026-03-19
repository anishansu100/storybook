import { fluxStrategy } from "./flux";
import type { ImageGenStrategy } from "./types";

// Swap strategy here when moving to Phase 2 (IP-Adapter) or Phase 3 (LoRA)
// IMAGE_GEN_STRATEGY=flux | ip-adapter | lora
const strategy = process.env.IMAGE_GEN_STRATEGY ?? "flux";

const strategies: Record<string, ImageGenStrategy> = {
  flux: fluxStrategy,
};

const resolved = strategies[strategy];
if (!resolved) throw new Error(`Unknown IMAGE_GEN_STRATEGY: ${strategy}`);

export const imageGen: ImageGenStrategy = resolved;
