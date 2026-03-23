import Anthropic from "@anthropic-ai/sdk";
import { env } from "~/env";

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export interface StoryPage {
  pageNumber: number;
  narrative: string;
  illustrationPrompt: string;
}

export async function generateNarrative(
  imageUrls: string[],
  tripContext?: string | null,
): Promise<StoryPage[]> {
  const contextText = tripContext
    ? `Additional context from the parent: ${tripContext}`
    : "No additional context provided.";

  const imageContent: Anthropic.ImageBlockParam[] = imageUrls.map((url) => ({
    type: "image",
    source: { type: "url", url },
  }));

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `You are a warm and creative children's book author.
Your job is to look at photos and create a short, magical children's storybook narrative.
The story should be joyful, age-appropriate (3-8 year olds), and capture the spirit of adventure.
IMPORTANT: Respond with a JSON array ONLY. No notes, no commentary, no markdown — just the raw JSON array starting with [ and ending with ].`,
    messages: [
      {
        role: "user",
        content: [
          ...imageContent,
          {
            type: "text",
            text: `${contextText}

Based on these trip photos, create a 5-page children's storybook.

Respond with a JSON array of exactly 5 objects, each with:
- "pageNumber": number (1-5)
- "narrative": string (2-4 sentences of warm, child-friendly story text for this page)
- "illustrationPrompt": string (a detailed prompt for generating a children's book illustration for this page — describe characters, setting, mood, action. Do NOT mention real photo details like cameras or screenshots.)

Example format:
[
  {
    "pageNumber": 1,
    "narrative": "One sunny morning, the family packed their bags for a grand adventure...",
    "illustrationPrompt": "A cheerful family of four with big smiles loading colorful luggage into a car, warm morning sunlight, illustrated in a soft watercolor children's book style"
  }
]`,
          },
        ],
      },
    ],
  });

  const raw =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  console.log("Claude raw response:", raw.slice(0, 500));

  // Strip markdown code fences if Claude wrapped the JSON
  const text = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Claude may have prepended a note object — try extracting the array directly
    const arrayMatch = /\[\s*\{[\s\S]*\}\s*\]/.exec(text);
    if (arrayMatch) {
      try {
        parsed = JSON.parse(arrayMatch[0]);
      } catch {
        // fall through to error below
      }
    }
    if (!parsed) {
      console.error("JSON parse failed. Raw text:", raw);
      throw new Error(`Claude returned invalid JSON: ${raw.slice(0, 200)}`);
    }
  }

  // Handle both a plain array and a wrapped object like { story: [...] }
  const pages = (
    Array.isArray(parsed)
      ? parsed
      : Array.isArray((parsed as Record<string, unknown>).story)
        ? (parsed as Record<string, unknown>).story
        : null
  ) as StoryPage[] | null;

  if (!pages || pages.length === 0) {
    console.error("Unexpected structure:", raw);
    throw new Error("Claude returned an invalid narrative structure");
  }

  return pages;
}
