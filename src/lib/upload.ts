import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

const IMAGE_ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const VIDEO_ALLOWED = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
]);

const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;

function imageExtensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function videoExtensionFor(type: string, filename: string) {
  if (type === "video/webm") return "webm";
  if (type === "video/quicktime") return "mov";
  const fromName = filename.split(".").pop()?.toLowerCase();
  if (fromName === "webm" || fromName === "mov" || fromName === "mp4") {
    return fromName;
  }
  return "mp4";
}

export async function saveUploadedImage(
  file: File | null,
  folder = "posts"
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!IMAGE_ALLOWED.has(file.type)) return null;
  if (file.size > IMAGE_MAX) return null;

  const ext = imageExtensionFor(file.type);
  const filename = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const localName = path.basename(filename);
  await writeFile(path.join(dir, localName), buffer);
  return `/uploads/${folder}/${localName}`;
}

export async function saveUploadedVideo(
  file: File | null,
  folder = "videos"
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!VIDEO_ALLOWED.has(file.type)) return null;
  if (file.size > VIDEO_MAX) return null;

  const ext = videoExtensionFor(file.type, file.name);
  const filename = `${folder}/${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, buffer, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  const localName = path.basename(filename);
  await writeFile(path.join(dir, localName), buffer);
  return `/uploads/${folder}/${localName}`;
}
