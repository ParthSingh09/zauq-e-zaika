import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { siteUrl } from "./utils";

export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export const GOOGLE_REDIRECT_URI = () => siteUrl("/api/auth/google/callback");
const FLOW_COOKIE = "zz_oauth";

const b64url = (b: Buffer) => b.toString("base64url");

/** Starts an authorisation-code flow with PKCE; state + verifier live in a short-lived httpOnly cookie. */
export async function beginGoogleFlow(next: string, area: "admin" | "site") {
  const state = b64url(randomBytes(24));
  const verifier = b64url(randomBytes(48));
  const challenge = b64url(createHash("sha256").update(verifier).digest());
  const store = await cookies();
  store.set(FLOW_COOKIE, JSON.stringify({ state, verifier, next, area }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // must survive the top-level redirect back from Google
    path: "/api/auth/google",
    maxAge: 600,
  });
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: GOOGLE_REDIRECT_URI(),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function readFlow(): Promise<{ state: string; verifier: string; next: string; area: "admin" | "site" } | null> {
  const store = await cookies();
  const raw = store.get(FLOW_COOKIE)?.value;
  store.delete(FLOW_COOKIE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export type GoogleProfile = { sub: string; email: string; name: string };

/** Exchanges the code (server-to-server) and validates the ID token claims. */
export async function exchangeGoogleCode(code: string, verifier: string): Promise<GoogleProfile> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: GOOGLE_REDIRECT_URI(),
      grant_type: "authorization_code",
      code_verifier: verifier,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Token exchange failed (${res.status})`);
  const { id_token } = (await res.json()) as { id_token?: string };
  if (!id_token) throw new Error("No ID token returned");
  // The token came straight from Google over TLS in exchange for our secret + PKCE verifier,
  // so decoding is safe; we still check the claims.
  const claims = JSON.parse(Buffer.from(id_token.split(".")[1], "base64url").toString("utf8")) as Record<string, unknown>;
  const issOk = claims.iss === "https://accounts.google.com" || claims.iss === "accounts.google.com";
  if (!issOk || claims.aud !== process.env.GOOGLE_CLIENT_ID || Number(claims.exp) * 1000 < Date.now()) throw new Error("Invalid ID token");
  if (claims.email_verified !== true || typeof claims.email !== "string" || typeof claims.sub !== "string")
    throw new Error("Your Google email address is not verified.");
  return { sub: claims.sub, email: claims.email.toLowerCase(), name: typeof claims.name === "string" && claims.name ? claims.name : claims.email.split("@")[0] };
}
