import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { generateNarrative } from "~/server/services/narrative";
import { imageGen } from "~/server/services/imageGen";
import {
  extractCharacters,
  generateCharacterReferenceImages,
} from "~/server/services/characterExtraction";

const ILLUSTRATION_STYLE =
  "Children's book illustration, soft watercolor style, warm and whimsical, gentle colors, storybook art";

export const storyRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        imageUrls: z.array(z.string().url()).min(1).max(20),
        tripContext: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Create story record
      const story = await ctx.db.story.create({
        data: {
          tripContext: input.tripContext,
          status: "GENERATING",
          uploadedImageUrls: input.imageUrls,
          clerkUserId: ctx.userId,
        },
      });

      try {
        // Run narrative generation and character extraction in parallel
        const [pages, rawCharacters] = await Promise.all([
          generateNarrative(input.imageUrls, input.tripContext),
          extractCharacters(input.imageUrls),
        ]);

        // Generate canonical reference images for each character
        const characters =
          rawCharacters.length > 0
            ? await generateCharacterReferenceImages(rawCharacters, story.id)
            : [];

        const referenceImageUrls = characters
          .map((c) => c.referenceImageUrl)
          .filter((url): url is string => Boolean(url));

        const characterDescText =
          characters.length > 0
            ? ` Characters: ${characters.map((c) => c.description).join("; ")}.`
            : "";

        // Generate illustrations sequentially to avoid rate limits
        for (const page of pages) {
          const enrichedPrompt = page.illustrationPrompt + characterDescText;

          const { imageUrl } = await imageGen.generate(
            {
              prompt: enrichedPrompt,
              referenceImages: referenceImageUrls,
              style: ILLUSTRATION_STYLE,
            },
            story.id,
            page.pageNumber,
          );

          await ctx.db.storyPage.create({
            data: {
              storyId: story.id,
              pageNumber: page.pageNumber,
              narrative: page.narrative,
              illustrationPrompt: page.illustrationPrompt,
              illustrationUrl: imageUrl,
            },
          });
        }

        await ctx.db.story.update({
          where: { id: story.id },
          data: { status: "COMPLETE" },
        });
      } catch (err) {
        await ctx.db.story.update({
          where: { id: story.id },
          data: { status: "FAILED" },
        });
        throw err;
      }

      return { storyId: story.id };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.story.findUnique({
        where: { id: input.id },
        include: {
          pages: { orderBy: { pageNumber: "asc" } },
        },
      });
    }),
});
