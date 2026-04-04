import { NextResponse } from "next/server";
import { createSignedUploadUrl, getPublicUrl } from "~/server/storage";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { filenames?: string[] };
    const filenames = body.filenames;

    if (!Array.isArray(filenames) || filenames.length === 0) {
      return NextResponse.json(
        { error: "filenames[] is required" },
        { status: 400 },
      );
    }

    if (filenames.length > 10) {
      return NextResponse.json(
        { error: "Maximum 10 images allowed" },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      filenames.map(async (filename) => {
        const { signedUrl, path, token } = await createSignedUploadUrl(filename);
        return { signedUrl, path, token, publicUrl: getPublicUrl(path) };
      }),
    );

    return NextResponse.json({ uploads: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Signed URL error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
