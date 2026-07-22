import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function saveUploadedImage(
  file: File | null,
  folder = "posts"
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED.has(file.type)) return null;
  if (file.size > 5 * 1024 * 1024) return null;

  const ext = extensionFor(file.type);
  const filename = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  // Production / when Blob is configured: durable public URL
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // Local fallback for `npm run dev`
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const localName = path.basename(filename);
  await writeFile(path.join(dir, localName), buffer);
  return `/uploads/${folder}/${localName}`;
}
