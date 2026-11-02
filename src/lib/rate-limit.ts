import "server-only";
import { headers } from "next/headers";
import { prisma } from "./db";

/** Best-effort client IP (Vercel / proxies set x-forwarded-for). */
export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "unknown").trim();
}

/**
 * Fixed-window rate limiter backed by the database so it works across
 * serverless instances. Returns true when the request is allowed.
 */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number, id?: string) {
  const key = `${bucket}:${id ?? (await clientIp())}`;
  const now = new Date();
  try {
    // Occasionally purge expired windows so the table stays small.
    if (Math.random() < 0.01) await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
    const row = await prisma.rateLimit.findUnique({ where: { key } });
    if (!row || row.resetAt < now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) },
        update: { count: 1, resetAt: new Date(now.getTime() + windowSeconds * 1000) },
      });
      return true;
    }
    if (row.count >= limit) return false;
    await prisma.rateLimit.update({ where: { key }, data: { count: { increment: 1 } } });
    return true;
  } catch (err) {
    console.error("rate limit error", err);
    return true; // fail open rather than locking everyone out
  }
}

/** Honeypot + minimum fill-time spam check for public forms. */
export function looksLikeSpam(form: FormData) {
  if (String(form.get("website") ?? "").trim() !== "") return true; // hidden honeypot field
  const started = Number(form.get("_ts") ?? 0);
  if (started && Date.now() - started < 2500) return true; // submitted faster than a human could
  return false;
}
