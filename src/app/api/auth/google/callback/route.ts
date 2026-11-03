import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { exchangeGoogleCode, googleConfigured, readFlow } from "@/lib/oauth";
import { rateLimit } from "@/lib/rate-limit";
import { safeRedirect } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const flow = await readFlow();
  const back = flow?.area === "admin" ? "/admin/login" : "/account/login";
  const fail = (code: string) => NextResponse.redirect(new URL(`${back}?error=${code}`, url));

  if (!googleConfigured()) return fail("google_unavailable");
  if (!(await rateLimit("google-cb", 30, 600))) return fail("too_many");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (url.searchParams.get("error")) return fail("google_cancelled");
  if (!flow || !code || !state || state !== flow.state) return fail("google_failed"); // CSRF / replay guard

  let profile;
  try {
    profile = await exchangeGoogleCode(code, flow.verifier);
  } catch (e) {
    console.error("Google sign-in failed", e);
    return fail("google_failed");
  }

  // 1) Known Google identity → that user. 2) Verified email matches an account → link it. 3) New customer.
  const linked = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
    include: { user: true },
  });
  let user = linked?.user ?? (await prisma.user.findUnique({ where: { email: profile.email } }));
  if (!user) {
    user = await prisma.user.create({ data: { email: profile.email, name: profile.name, role: "CUSTOMER" } });
    await prisma.order.updateMany({ where: { email: profile.email, userId: null }, data: { userId: user.id } });
  }
  if (!linked) {
    await prisma.oAuthAccount.create({ data: { provider: "google", providerAccountId: profile.sub, email: profile.email, userId: user.id } });
  }

  if (flow.area === "admin" && user.role !== "ADMIN") return fail("not_admin");
  await createSession(user.id);
  const dest = safeRedirect(flow.next, user.role === "ADMIN" && flow.area === "admin" ? "/admin" : "/account");
  return NextResponse.redirect(new URL(dest, url));
}
