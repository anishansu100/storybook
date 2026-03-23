import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { env } from "~/env";
import { uploadFile } from "~/server/storage";

const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export interface CharacterInfo {
  label: string;
  description: string;
  referenceImageUrl?: string;
}

/**
 * Uses Claude Vision to extract the main characters from uploaded photos.
 * Returns descriptions detailed enough for consistent image generation.
 */
export async function extractCharacters(
  imageUrls: string[],
): Promise<CharacterInfo[]> {
  const imageContent: Anthropic.ImageBlockParam[] = imageUrls
    .slice(0, 10) // limit to avoid token overflow
    .map((url) => ({ type: "image", source: { type: "url", url } }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are an AI that analyzes photos to identify the main people who appear most frequently or prominently.
Respond with a JSON object ONLY. No notes, no commentary — just raw JSON starting with { and ending with }.`,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          {
            type: "text",
            text: `Identify the 1-2 main people (subjects) who appear most in these photos.
For each person, provide a detailed physical description suitable for consistent AI image generation.

Respond with this JSON format:
{
  "characters": [
    {
      "label": "short label like 'young boy' or 'girl in red hat'",
      "description": "detailed description: approximate age, skin tone, hair color/length/style, eye color if visible, distinctive features, typical clothing style seen in photos"
    }
  ]
}

If you cannot clearly identify any people, return { "characters": [] }.`,
          },
        ],
      },
    ],
  });

  const raw =
    response.content[0]?.type === "text" ? response.content[0].text : "";
  const text = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(text) as {
      characters: { label: string; description: string }[];
    };
    return parsed.characters ?? [];
  } catch {
    console.error("Character extraction JSON parse failed:", raw);
    return [];
  }
}

/**
 * Generates a canonical full-body reference image for each character using gpt-image-1.
 * The reference image is uploaded to Supabase Storage and the URL is returned.
 */
export async function generateCharacterReferenceImages(
  characters: CharacterInfo[],
  storyId: string,
): Promise<CharacterInfo[]> {
  const results = await Promise.all(
    characters.map(async (char, i) => {
      const prompt =
        `Children's book illustration, full body character portrait, soft watercolor style, warm and whimsical: ` +
        `${char.description}. ` +
        `Standing pose, simple light background, centered in frame, consistent design for repeated use.`;

      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024",
        quality: "medium",
      });

      const b64 = result.data?.[0]?.b64_json;
      if (!b64) throw new Error("gpt-image-1 returned no image for character reference");

      const buffer = Buffer.from(b64, "base64");
      const referenceImageUrl = await uploadFile(
        buffer,
        `${storyId}-char-ref-${i}.png`,
        "image/png",
      );

      return { ...char, referenceImageUrl };
    }),
  );

  return results;
}
