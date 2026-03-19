import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { generateNarrative } from "~/server/services/narrative";
import { imageGen } from "~/server/services/imageGen";

const ILLUSTRATION_STYLE =
  "Children's book illustration, soft watercolor style, warm and whimsical, gentle colors, storybook art";

export const storyRouter = createTRPCRouter({
  create: publicProcedure
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
        },
      });

      try {
        // Generate narrative via Claude
        const pages = await generateNarrative(
          input.imageUrls,
          input.tripContext,
        );

        // Generate illustrations via Flux, sequentially to avoid rate limits
        for (const page of pages) {
          const { imageUrl } = await imageGen.generate({
            prompt: page.illustrationPrompt,
            style: ILLUSTRATION_STYLE,
          });

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
