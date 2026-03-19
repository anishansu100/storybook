import heicConvert from "heic-convert";
import { type NextRequest, NextResponse } from "next/server";
import { uploadFile } from "~/server/storage";

export const maxDuration = 60;

const HEIC_TYPES = new Set(["image/heic", "image/heif", "image/heic-sequence"]);

async function normalizeImage(
  buffer: Buffer,
  filename: string,
  contentType: string,
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  if (HEIC_TYPES.has(contentType.toLowerCase())) {
    const converted = await heicConvert({
      buffer: buffer as unknown as ArrayBufferLike,
      format: "JPEG",
      quality: 0.9,
    });
    return {
      buffer: Buffer.from(converted),
      filename: filename.replace(/\.(heic|heif)$/i, ".jpg"),
      contentType: "image/jpeg",
    };
  }
  return { buffer, filename, contentType };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      console.log(`Uploading: ${file.name} (${file.type}, ${file.size} bytes)`);
      const raw = Buffer.from(await file.arrayBuffer());
      const { buffer, filename, contentType } = await normalizeImage(
        raw,
        file.name,
        file.type,
      );
      const url = await uploadFile(buffer, filename, contentType);
      urls.push(url);
    }

    return NextResponse.json({ urls });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Upload error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
