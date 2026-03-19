export interface ImageGenStrategy {
  generate(params: {
    prompt: string;
    referenceImages?: string[]; // unused in Phase 1, ready for IP-Adapter in Phase 2
    style: string;
  }): Promise<{ imageUrl: string }>;
}
