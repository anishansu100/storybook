import { fal } from "@fal-ai/client";
import { env } from "~/env";
import type { ImageGenStrategy } from "./types";

// Fallback strategy — activate with IMAGE_GEN_STRATEGY=flux
export const fluxStrategy: ImageGenStrategy = {
  async generate({ prompt, style }) {
    if (!env.FAL_API_KEY) throw new Error("FAL_API_KEY is required for the flux strategy");
    fal.config({ credentials: env.FAL_API_KEY });

    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: `${style}. ${prompt}`,
        image_size: "landscape_4_3",
        num_images: 1,
      },
    });

    const images = (result as { data: { images: { url: string }[] } }).data
      .images;
    const image = images[0];
    if (!image?.url) throw new Error("Flux returned no image");
    return { imageUrl: image.url };
  },
};
