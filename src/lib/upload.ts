import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function saveUploadedImage(
  file: File | null,
  folder = "posts"
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!ALLOWED.has(file.type)) return null;
  if (file.size > 5 * 1024 * 1024) return null;

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : file.type === "image/gif"
          ? "gif"
          : "jpg";

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });

  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), buffer);

  return `/uploads/${folder}/${filename}`;
}
