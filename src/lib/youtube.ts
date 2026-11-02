const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extracts an 11-character YouTube video ID from a URL or raw ID. Returns null if invalid. */
export function parseYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null;
  const value = input.trim();
  if (ID_RE.test(value)) return value;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      if (url.pathname === "/watch") id = url.searchParams.get("v");
      else {
        const m = url.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/);
        id = m?.[1] ?? null;
      }
    }
    return id && ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

export const youtubeThumb = (id: string, quality: "hq" | "maxres" = "hq") =>
  `https://i.ytimg.com/vi/${id}/${quality === "maxres" ? "maxresdefault" : "hqdefault"}.jpg`;

export const youtubeWatchUrl = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?rel=0&autoplay=1`;
