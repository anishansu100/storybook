import OpenAI from "openai";
import { env } from "~/env";
import { uploadFile } from "~/server/storage";
import type { ImageGenStrategy } from "./types";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export const gpt4oStrategy: ImageGenStrategy = {
  async generate({ prompt, referenceImages, style }, storyId, pageNumber) {
    const fullPrompt = `${style}. ${prompt}. Keep all characters visually consistent with the provided reference images.`;

    let b64: string | undefined;

    if (referenceImages && referenceImages.length > 0) {
      // Download reference images and pass as File objects to images.edit
      const files = await Promise.all(
        referenceImages.map(async (url, i) => {
          const res = await fetch(url);
          const buf = Buffer.from(await res.arrayBuffer());
          return new File([buf], `char${i}.png`, { type: "image/png" });
        }),
      );

      const result = await openai.images.edit({
        model: "gpt-image-1",
        image: files,
        prompt: fullPrompt,
        size: "1536x1024",
        quality: "medium",
      });
      b64 = result.data?.[0]?.b64_json ?? undefined;
    } else {
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: `${style}. ${prompt}`,
        size: "1536x1024",
        quality: "medium",
      });
      b64 = result.data?.[0]?.b64_json ?? undefined;
    }

    if (!b64) throw new Error("gpt-image-1 returned no image");

    const buffer = Buffer.from(b64, "base64");
    const imageUrl = await uploadFile(
      buffer,
      `${storyId ?? "story"}-page-${pageNumber ?? Date.now()}.png`,
      "image/png",
    );

    return { imageUrl };
  },
};
