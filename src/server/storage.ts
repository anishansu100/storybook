import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "~/env";

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = "storybook-uploads";

export async function uploadFile(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<string> {
  const path = `${Date.now()}-${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function createSignedUploadUrl(filename: string): Promise<{
  signedUrl: string;
  path: string;
  token: string;
}> {
  const path = `${Date.now()}-${filename}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);

  if (error || !data) {
    throw new Error(`Failed to create signed URL: ${error?.message}`);
  }

  return { signedUrl: data.signedUrl, path: data.path, token: data.token };
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
