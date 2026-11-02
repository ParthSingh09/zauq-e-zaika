"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import {
  createSession,
  destroyOtherSessions,
  destroySession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { looksLikeSpam, rateLimit } from "@/lib/rate-limit";
import { safeRedirect } from "@/lib/utils";
import { fieldErrors, type ActionState } from "../action-state";

// Valid bcrypt hash of a random string; used to equalise timing for unknown accounts.
const DUMMY_HASH = "$2b$12$XlnjKULbYSibXP3LZMhYt.ypZG089ZD2EntF9nmtRnJdy48SxMLha";

const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(160);
const password = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(128)
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/\d/, "Include at least one number.");
const phone = z
  .string()
  .trim()
  .max(20)
  .regex(/^[+()\d\s-]*$/, "Please enter a valid phone number.")
  .optional()
  .or(z.literal(""));

// ───────── Registration & login ─────────

export async function register(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z
    .object({ name: z.string().trim().min(2, "Please enter your name.").max(100), email, phone, password })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (looksLikeSpam(form)) return { ok: false, message: "Something went wrong. Please wait a moment and try again." };
  if (!(await rateLimit("register", 5, 3600))) return { ok: false, message: "Too many attempts. Please try again later." };
  const { name, email: em, phone: ph, password: pw } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email: em } });
  if (exists) return { ok: false, message: "An account with this email already exists. Please sign in.", errors: { email: "Already registered." } };
  const user = await prisma.user.create({
    data: { name, email: em, phone: ph || null, passwordHash: await hashPassword(pw), role: "CUSTOMER" },
  });
  // Link earlier guest orders placed with the same email.
  await prisma.order.updateMany({ where: { email: em, userId: null }, data: { userId: user.id } });
  await createSession(user.id);
  redirect(safeRedirect(form.get("next"), "/account"));
}

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ email, password: z.string().min(1, "Please enter your password.").max(128) }).safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return fieldErrors(parsed.error);
  // Limit by IP and by account to slow down password guessing.
  if (!(await rateLimit("login-ip", 20, 900)) || !(await rateLimit("login-acct", 8, 900, parsed.data.email))) {
    return { ok: false, message: "Too many sign-in attempts. Please wait 15 minutes and try again." };
  }
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  // Always run bcrypt to keep timing similar whether or not the account exists.
  const valid = await verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !valid) return { ok: false, message: "Incorrect email or password." };

  const adminArea = form.get("area") === "admin";
  if (adminArea && user.role !== "ADMIN") return { ok: false, message: "This account does not have admin access." };
  await createSession(user.id);
  redirect(safeRedirect(form.get("next"), adminArea ? "/admin" : user.role === "ADMIN" ? "/admin" : "/account"));
}

export async function logout() {
  await destroySession();
  redirect("/");
}

// ───────── Profile ─────────

export async function updateProfile(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  const parsed = z.object({ name: z.string().trim().min(2, "Please enter your name.").max(100), phone }).safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldErrors(parsed.error);
  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name, phone: parsed.data.phone || null } });
  revalidatePath("/account");
  return { ok: true, message: "Profile updated." };
}

export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in again." };
  if (!(await rateLimit("pw-change", 10, 3600, user.id))) return { ok: false, message: "Too many attempts. Try again later." };
  const parsed = z
    .object({ current: z.string().min(1, "Enter your current password."), next: password, confirm: z.string() })
    .refine((d) => d.next === d.confirm, { message: "Passwords do not match.", path: ["confirm"] })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldErrors(parsed.error);
  const record = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!(await verifyPassword(parsed.data.current, record.passwordHash)))
    return { ok: false, message: "Current password is incorrect.", errors: { current: "Incorrect password." } };
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(parsed.data.next) } });
  await destroyOtherSessions(user.id);
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

// ───────── Saved recipes & wishlist ─────────

export type ToggleResult = { ok: boolean; saved?: boolean; needsLogin?: boolean; message?: string };

export async function getSavedStatus(recipeId: string): Promise<{ loggedIn: boolean; saved: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { loggedIn: false, saved: false };
  const row = await prisma.savedRecipe.findUnique({ where: { userId_recipeId: { userId: user.id, recipeId } } });
  return { loggedIn: true, saved: Boolean(row) };
}

export async function toggleSavedRecipe(recipeId: string): Promise<ToggleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needsLogin: true };
  if (typeof recipeId !== "string" || recipeId.length > 40) return { ok: false };
  const key = { userId_recipeId: { userId: user.id, recipeId } };
  const existing = await prisma.savedRecipe.findUnique({ where: key });
  if (existing) {
    await prisma.savedRecipe.delete({ where: key });
    revalidatePath("/account");
    return { ok: true, saved: false };
  }
  const recipe = await prisma.recipe.findFirst({ where: { id: recipeId, published: true }, select: { id: true } });
  if (!recipe) return { ok: false, message: "Recipe not found." };
  await prisma.savedRecipe.create({ data: { userId: user.id, recipeId } });
  revalidatePath("/account");
  return { ok: true, saved: true };
}

export async function getWishlistStatus(productId: string): Promise<{ loggedIn: boolean; saved: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { loggedIn: false, saved: false };
  const row = await prisma.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  return { loggedIn: true, saved: Boolean(row) };
}

export async function toggleWishlist(productId: string): Promise<ToggleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, needsLogin: true };
  if (typeof productId !== "string" || productId.length > 40) return { ok: false };
  const key = { userId_productId: { userId: user.id, productId } };
  const existing = await prisma.wishlistItem.findUnique({ where: key });
  if (existing) {
    await prisma.wishlistItem.delete({ where: key });
    revalidatePath("/account");
    return { ok: true, saved: false };
  }
  const product = await prisma.product.findFirst({ where: { id: productId, status: "ACTIVE" }, select: { id: true } });
  if (!product) return { ok: false, message: "Product not found." };
  await prisma.wishlistItem.create({ data: { userId: user.id, productId } });
  revalidatePath("/account");
  return { ok: true, saved: true };
}

// ───────── Reviews ─────────

export async function submitReview(_: ActionState, form: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Please sign in to leave a review." };
  if (!(await rateLimit("review", 10, 3600, user.id))) return { ok: false, message: "Too many reviews. Please try later." };
  const parsed = z
    .object({
      recipeId: z.string().min(1).max(40),
      rating: z.coerce.number().int().min(1, "Please choose a rating.").max(5),
      comment: z.string().trim().max(2000).optional().default(""),
    })
    .safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldErrors(parsed.error);
  const recipe = await prisma.recipe.findFirst({ where: { id: parsed.data.recipeId, published: true }, select: { slug: true } });
  if (!recipe) return { ok: false, message: "Recipe not found." };
  await prisma.recipeReview.upsert({
    where: { recipeId_userId: { recipeId: parsed.data.recipeId, userId: user.id } },
    create: { recipeId: parsed.data.recipeId, userId: user.id, rating: parsed.data.rating, comment: parsed.data.comment },
    update: { rating: parsed.data.rating, comment: parsed.data.comment },
  });
  revalidatePath(`/recipes/${recipe.slug}`);
  return { ok: true, message: "Thank you for your review!" };
}

/** Lightweight session probe for statically rendered pages. */
export async function getSessionInfo(): Promise<{ loggedIn: boolean; name?: string }> {
  const user = await getCurrentUser();
  return user ? { loggedIn: true, name: user.name } : { loggedIn: false };
}
