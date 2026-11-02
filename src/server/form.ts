import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { SETTINGS_TAG } from "@/lib/settings";

export const str = (f: FormData, k: string, max = 5000) => String(f.get(k) ?? "").trim().slice(0, max);
export const optStr = (f: FormData, k: string, max = 5000) => str(f, k, max) || null;
export const bool = (f: FormData, k: string) => f.get(k) === "on" || f.get(k) === "true";
export const int = (f: FormData, k: string, fallback = 0, min = 0, max = 1_000_000) => {
  const n = Math.round(Number(f.get(k)));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};
export const lines = (f: FormData, k: string) =>
  str(f, k, 20000)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
export const json = <T,>(f: FormData, k: string, fallback: T): T => {
  try {
    return JSON.parse(String(f.get(k) ?? "")) as T;
  } catch {
    return fallback;
  }
};

/** Only allow site-relative paths or https URLs for images and links stored by admins. */
export const safeUrl = (v: string | null | undefined) => {
  if (!v) return null;
  const s = v.trim();
  return /^(https:\/\/|\/(?!\/))/.test(s) ? s.slice(0, 1000) : null;
};

/** Re-renders cached public pages after content changes. */
export function refreshSite() {
  revalidatePath("/", "layout");
}
export function refreshSettings() {
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
}
export function refreshPages() {
  revalidateTag("pages");
  revalidatePath("/", "layout");
}
