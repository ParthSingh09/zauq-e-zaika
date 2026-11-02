"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { looksLikeSpam, rateLimit } from "@/lib/rate-limit";
import { fieldErrors, type ActionState } from "../action-state";

const email = z.string().trim().toLowerCase().email("Please enter a valid email address.").max(160);

export async function subscribeNewsletter(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = z.object({ email }).safeParse({ email: form.get("email") });
  if (!parsed.success) return fieldErrors(parsed.error);
  // Bots get a fake success so they don't retry.
  if (looksLikeSpam(form)) return { ok: true, message: "Thank you for subscribing!" };
  if (!(await rateLimit("newsletter", 5, 3600))) return { ok: false, message: "Too many attempts. Please try again later." };
  await prisma.newsletterSubscriber.upsert({
    where: { email: parsed.data.email },
    create: { email: parsed.data.email },
    update: { active: true },
  });
  return { ok: true, message: "Thank you for subscribing! Fresh recipes are coming your way." };
}

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email,
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^[+()\d\s-]*$/, "Please enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  subject: z.string().trim().min(3, "Please add a subject.").max(150),
  message: z.string().trim().min(10, "Please write a few more words (at least 10 characters).").max(5000),
});

export async function submitEnquiry(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return fieldErrors(parsed.error);
  if (looksLikeSpam(form)) return { ok: true, message: "Thank you! Your message has been received." };
  if (!(await rateLimit("contact", 5, 3600))) {
    return { ok: false, message: "You have sent several messages recently. Please try again in a little while." };
  }
  await prisma.enquiry.create({ data: { ...parsed.data, phone: parsed.data.phone || null } });
  return { ok: true, message: "Thank you! Your message has been received — we’ll get back to you soon." };
}
