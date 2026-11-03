import { NextResponse, type NextRequest } from "next/server";
import { beginGoogleFlow, googleConfigured } from "@/lib/oauth";
import { rateLimit } from "@/lib/rate-limit";
import { safeRedirect } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const area = url.searchParams.get("area") === "admin" ? "admin" : "site";
  const back = area === "admin" ? "/admin/login" : "/account/login";
  if (!googleConfigured()) return NextResponse.redirect(new URL(`${back}?error=google_unavailable`, url));
  if (!(await rateLimit("google-start", 30, 600))) return NextResponse.redirect(new URL(`${back}?error=too_many`, url));
  const next = safeRedirect(url.searchParams.get("next"), area === "admin" ? "/admin" : "/account");
  return NextResponse.redirect(await beginGoogleFlow(next, area));
}
