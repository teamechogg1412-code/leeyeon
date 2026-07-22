export function getYoutubeEmbedUrl(url: string | null | undefined) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const id = u.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      const parts = u.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx >= 0 && parts[embedIdx + 1]) {
        return `https://www.youtube.com/embed/${parts[embedIdx + 1]}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function isDirectVideo(url: string | null | undefined) {
  if (!url) return false;
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return true;
  // Client-uploaded Blob videos keep a video extension; also accept
  // /uploads/videos/ local fallback paths without a known query string.
  if (/\/uploads\/videos\//i.test(url)) return true;
  if (/blob\.vercel-storage\.com/i.test(url) && /\/videos\//i.test(url)) {
    return true;
  }
  return false;
}
