import { fal } from "@fal-ai/client";
import { env } from "~/env";
import type { ImageGenStrategy } from "./types";

fal.config({ credentials: env.FAL_API_KEY });

export const fluxStrategy: ImageGenStrategy = {
  async generate({ prompt, style }) {
    const result = await fal.subscribe("fal-ai/flux-pro/v1.1", {
      input: {
        prompt: `${style}. ${prompt}`,
        image_size: "landscape_4_3",
        num_images: 1,
        safety_tolerance: "2",
      },
    });

    const images = (result as { data: { images: { url: string }[] } }).data
      .images;
    const image = images[0];
    if (!image?.url) throw new Error("Flux returned no image");
    return { imageUrl: image.url };
  },
};
