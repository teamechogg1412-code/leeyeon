/** Google Drive / CDN image URL helpers (shared with Stardom Forge patterns). */

function getGoogleDriveFileId(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/drive\.google\.com\/drive\/(?:u\/\d+\/)?folders\//i.test(trimmed)) {
    return null;
  }
  const fileMatchUser = trimmed.match(
    /drive\.google\.com\/file\/u\/\d+\/d\/([^/?#]+)/i
  );
  if (fileMatchUser) return fileMatchUser[1];
  const fileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/?#]+)/i);
  if (fileMatch) return fileMatch[1];
  const thumbMatch = trimmed.match(
    /drive\.google\.com\/thumbnail\?[^#]*\bid=([^&]+)/i
  );
  if (thumbMatch) return thumbMatch[1];
  const openMatch = trimmed.match(/drive\.google\.com\/open\?id=([^&]+)/i);
  if (openMatch) return openMatch[1];
  try {
    const u = new URL(
      trimmed.startsWith("//") ? `https:${trimmed}` : trimmed
    );
    if (
      u.hostname === "drive.google.com" ||
      u.hostname === "docs.google.com"
    ) {
      const id = u.searchParams.get("id");
      if (id && /^[a-zA-Z0-9_-]{10,}$/.test(id)) return id;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function resolveImageUrlsForDisplay(
  url: string | null | undefined
): string[] {
  if (!url) return [];
  const raw = String(url).trim();
  if (!raw) return [];
  if (raw.startsWith("data:") || raw.startsWith("blob:")) return [raw];

  let normalized = raw;
  if (normalized.startsWith("//")) normalized = `https:${normalized}`;
  else if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  const id = getGoogleDriveFileId(normalized);
  if (id) {
    return [
      `https://drive.google.com/thumbnail?id=${id}&sz=w2048`,
      `https://drive.google.com/uc?export=view&id=${id}`,
    ];
  }
  return [normalized];
}

export function resolveImageUrlForDisplay(
  url: string | null | undefined
): string {
  return resolveImageUrlsForDisplay(url)[0] ?? "";
}
