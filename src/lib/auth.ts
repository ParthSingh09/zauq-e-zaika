import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { Role, User } from "@prisma/client";
import { prisma } from "./db";

export const SESSION_COOKIE = "zz_session";
const SESSION_DAYS = 30;

export type SessionUser = Pick<User, "id" | "email" | "name" | "phone" | "role">;

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

/** Invalidates every session for a user (e.g. after a password change), except optionally the current one. */
export async function destroyOtherSessions(userId: string) {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  await prisma.session.deleteMany({
    where: { userId, ...(token ? { NOT: { tokenHash: hashToken(token) } } : {}) },
  });
}

/** Returns the signed-in user for this request (memoised per request), or null. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: { select: { id: true, email: true, name: true, phone: true, role: true } } },
  });
  if (!session) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }
  return session.user;
});

export async function requireUser(redirectTo = "/account") {
  const user = await getCurrentUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(redirectTo)}`);
  return user;
}

/** Use in every admin page AND every admin server action / route handler. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (user.role !== "ADMIN") redirect("/admin/login?error=forbidden");
  return user;
}

/** For route handlers: returns the admin or null (no redirect). */
export async function getAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" ? user : null;
}

export function hasRole(user: SessionUser | null, role: Role) {
  return user?.role === role;
}
