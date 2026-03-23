export interface ImageGenStrategy {
  generate(
    params: {
      prompt: string;
      referenceImages?: string[];
      style: string;
    },
    storyId?: string,
    pageNumber?: number,
  ): Promise<{ imageUrl: string }>;
}
