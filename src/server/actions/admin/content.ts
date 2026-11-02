"use server";

import { z } from "zod";
import type { EnquiryStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { hashPassword, requireAdmin } from "@/lib/auth";
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from "@/lib/settings";
import { rupeesToPaise } from "@/lib/money";
import { parseYouTubeId } from "@/lib/youtube";
import { bool, int, optStr, refreshPages, refreshSettings, refreshSite, safeUrl, str } from "../../form";
import type { ActionState } from "../../action-state";

// ───────── Site settings ─────────

const safeHref = (v: string) => (/^(https:\/\/|\/(?!\/)|mailto:|tel:)/.test(v) ? v : "");

export async function saveSettingsGroup(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const group = str(f, "group") as keyof Settings;
  const current = await getSettings();
  switch (group) {
    case "announcement":
      await saveSettings("announcement", {
        enabled: bool(f, "enabled"),
        text: str(f, "text", 200),
        linkLabel: str(f, "linkLabel", 40),
        linkHref: safeHref(str(f, "linkHref", 300)),
      });
      break;
    case "hero":
      await saveSettings("hero", {
        eyebrow: str(f, "eyebrow", 80),
        title: str(f, "title", 120) || DEFAULT_SETTINGS.hero.title,
        subtitle: str(f, "subtitle", 400),
        primaryCtaLabel: str(f, "primaryCtaLabel", 40) || "Explore Recipes",
        primaryCtaHref: safeHref(str(f, "primaryCtaHref", 300)) || "/recipes",
        secondaryCtaLabel: str(f, "secondaryCtaLabel", 40),
        secondaryCtaHref: safeHref(str(f, "secondaryCtaHref", 300)) || "/about",
        image: safeUrl(str(f, "image")) || DEFAULT_SETTINGS.hero.image,
        imageAlt: str(f, "imageAlt", 200),
      });
      break;
    case "home": {
      const whyChoose = [0, 1, 2, 3]
        .map((i) => ({ title: str(f, `why.${i}.title`, 60), body: str(f, `why.${i}.body`, 240) }))
        .filter((w) => w.title);
      await saveSettings("home", {
        introTitle: str(f, "introTitle", 120),
        introBody: str(f, "introBody", 1200),
        philosophyTitle: str(f, "philosophyTitle", 120),
        philosophyBody: str(f, "philosophyBody", 1200),
        philosophyImage: safeUrl(str(f, "philosophyImage")) || DEFAULT_SETTINGS.home.philosophyImage,
        whyChoose: whyChoose.length ? whyChoose : current.home.whyChoose,
      });
      break;
    }
    case "contact": {
      const email = str(f, "email", 160);
      if (email && !z.string().email().safeParse(email).success) return { ok: false, message: "Enter a valid email.", errors: { email: "Invalid email." } };
      await saveSettings("contact", {
        email,
        phone: str(f, "phone", 30),
        whatsappNumber: str(f, "whatsappNumber", 20).replace(/[^\d+]/g, ""),
        whatsappMessage: str(f, "whatsappMessage", 200),
        address: str(f, "address", 400),
        hours: str(f, "hours", 200),
      });
      break;
    }
    case "social": {
      const u = (k: string) => (/^https:\/\//.test(str(f, k, 300)) ? str(f, k, 300) : "");
      await saveSettings("social", { youtube: u("youtube"), instagram: u("instagram"), facebook: u("facebook"), pinterest: u("pinterest"), x: u("x") });
      break;
    }
    case "shop":
      await saveSettings("shop", {
        enabled: bool(f, "enabled"),
        checkoutEnabled: bool(f, "checkoutEnabled"),
        notice: str(f, "notice", 400),
        allowDelivery: bool(f, "allowDelivery"),
        allowPickup: bool(f, "allowPickup"),
        pickupAddress: str(f, "pickupAddress", 400),
        pickupInstructions: str(f, "pickupInstructions", 400),
        allowPayOnDelivery: bool(f, "allowPayOnDelivery"),
        razorpayEnabled: bool(f, "razorpayEnabled"),
        preparationTime: str(f, "preparationTime", 120),
        orderCutoff: str(f, "orderCutoff", 120),
        minOrderPaise: rupeesToPaise(str(f, "minOrder")) ?? 0,
      });
      break;
    default:
      return { ok: false, message: "Unknown settings group." };
  }
  refreshSettings();
  return { ok: true, message: "Settings saved." };
}

// ───────── Pages ─────────

export async function savePage(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const slug = str(f, "slug", 80);
  const title = str(f, "title", 160);
  const body = str(f, "body", 60000);
  if (title.length < 2) return { ok: false, message: "Title is required.", errors: { title: "Required." } };
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return { ok: false, message: "Page not found." };
  await prisma.page.update({ where: { slug }, data: { title, body, needsReview: bool(f, "needsReview") } });
  refreshPages();
  return { ok: true, message: "Page saved." };
}

// ───────── Videos ─────────

export async function saveVideo(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const youtubeId = parseYouTubeId(str(f, "url", 300));
  if (!youtubeId) return { ok: false, message: "Enter a valid YouTube video link.", errors: { url: "Invalid YouTube link." } };
  const title = str(f, "title", 200);
  if (title.length < 2) return { ok: false, message: "Please add a title.", errors: { title: "Required." } };
  const dateRaw = str(f, "publishedAt");
  const recipeId = str(f, "recipeId") || null;
  const data = {
    youtubeId,
    title,
    description: str(f, "description", 3000),
    publishedAt: dateRaw && !Number.isNaN(Date.parse(dateRaw)) ? new Date(dateRaw) : null,
    featured: bool(f, "featured"),
    published: bool(f, "published"),
    sortOrder: int(f, "sortOrder", 0, 0, 9999),
    recipeId: recipeId && (await prisma.recipe.findUnique({ where: { id: recipeId } })) ? recipeId : null,
  };
  try {
    if (id) await prisma.video.update({ where: { id }, data });
    else await prisma.video.create({ data });
  } catch {
    return { ok: false, message: "This video has already been added.", errors: { url: "Already added." } };
  }
  refreshSite();
  return { ok: true, message: id ? "Video saved." : "Video added.", data: { redirect: "/admin/videos" } };
}

export async function deleteVideo(id: string) {
  await requireAdmin();
  await prisma.video.delete({ where: { id } }).catch(() => null);
  refreshSite();
  return { ok: true, message: "Video removed." };
}

/** Optional: imports the latest uploads using the YouTube Data API (requires YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID). */
export async function importLatestVideos() {
  await requireAdmin();
  const key = process.env.YOUTUBE_API_KEY;
  const channel = process.env.YOUTUBE_CHANNEL_ID;
  if (!key || !channel) return { ok: false, message: "YouTube API is not configured (YOUTUBE_API_KEY, YOUTUBE_CHANNEL_ID)." };
  const uploads = channel.startsWith("UC") ? `UU${channel.slice(2)}` : channel;
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=12&playlistId=${encodeURIComponent(uploads)}&key=${encodeURIComponent(key)}`,
    { cache: "no-store" },
  );
  if (!res.ok) return { ok: false, message: `YouTube API error (${res.status}). Check your API key and channel ID.` };
  const body = (await res.json()) as { items?: { snippet: { title: string; description: string; publishedAt: string; resourceId: { videoId: string } } }[] };
  let added = 0;
  for (const item of body.items ?? []) {
    const vid = item.snippet.resourceId.videoId;
    const exists = await prisma.video.findUnique({ where: { youtubeId: vid } });
    if (exists) continue;
    await prisma.video.create({
      data: { youtubeId: vid, title: item.snippet.title.slice(0, 200), description: item.snippet.description.slice(0, 3000), publishedAt: new Date(item.snippet.publishedAt), published: true },
    });
    added++;
  }
  refreshSite();
  return { ok: true, message: added ? `Imported ${added} new video${added > 1 ? "s" : ""}.` : "No new videos found." };
}

// ───────── Testimonials ─────────

export async function saveTestimonial(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name", 80);
  const quote = str(f, "quote", 800);
  if (name.length < 2 || quote.length < 5) return { ok: false, message: "Name and quote are required.", errors: { name: name.length < 2 ? "Required." : "", quote: quote.length < 5 ? "Required." : "" } };
  const data = { name, quote, location: optStr(f, "location", 80), published: bool(f, "published"), sortOrder: int(f, "sortOrder", 0, 0, 999) };
  if (id) await prisma.testimonial.update({ where: { id }, data });
  else await prisma.testimonial.create({ data });
  refreshSite();
  return { ok: true, message: "Testimonial saved." };
}

export async function deleteTestimonial(id: string) {
  await requireAdmin();
  await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  refreshSite();
  return { ok: true, message: "Testimonial deleted." };
}

// ───────── Reviews moderation ─────────

export async function setReviewApproved(id: string, approved: boolean) {
  await requireAdmin();
  await prisma.recipeReview.update({ where: { id }, data: { approved } });
  refreshSite();
  return { ok: true, message: approved ? "Review is visible." : "Review hidden." };
}

export async function deleteReview(id: string) {
  await requireAdmin();
  await prisma.recipeReview.delete({ where: { id } }).catch(() => null);
  refreshSite();
  return { ok: true, message: "Review deleted." };
}

// ───────── Enquiries & newsletter ─────────

export async function setEnquiryStatus(id: string, status: EnquiryStatus) {
  await requireAdmin();
  if (!["NEW", "IN_PROGRESS", "RESOLVED"].includes(status)) return { ok: false, message: "Invalid status." };
  await prisma.enquiry.update({ where: { id }, data: { status } });
  return { ok: true, message: "Enquiry updated." };
}

export async function deleteEnquiry(id: string) {
  await requireAdmin();
  await prisma.enquiry.delete({ where: { id } }).catch(() => null);
  return { ok: true, message: "Enquiry deleted." };
}

export async function deleteSubscriber(id: string) {
  await requireAdmin();
  await prisma.newsletterSubscriber.delete({ where: { id } }).catch(() => null);
  return { ok: true, message: "Subscriber removed." };
}

// ───────── Delivery regions ─────────

export async function saveRegion(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = str(f, "id");
  const name = str(f, "name", 80);
  const postalCodes = str(f, "postalCodes", 5000).split(/[\s,]+/).map((c) => c.replace(/\D/g, "")).filter((c) => c.length >= 2 && c.length <= 6);
  const errors: Record<string, string> = {};
  if (name.length < 2) errors.name = "Name is required.";
  if (!postalCodes.length) errors.postalCodes = "Add at least one PIN code or prefix.";
  const charge = rupeesToPaise(str(f, "charge") || "0");
  const minOrder = rupeesToPaise(str(f, "minOrder") || "0");
  const freeAboveRaw = str(f, "freeAbove");
  const freeAbove = freeAboveRaw ? rupeesToPaise(freeAboveRaw) : null;
  if (charge === null) errors.charge = "Invalid amount.";
  if (Object.keys(errors).length) return { ok: false, message: "Please fix the highlighted fields.", errors };
  const data = { name, postalCodes: [...new Set(postalCodes)], chargePaise: charge!, minOrderPaise: minOrder ?? 0, freeAbovePaise: freeAbove, active: bool(f, "active") };
  if (id) await prisma.deliveryRegion.update({ where: { id }, data });
  else await prisma.deliveryRegion.create({ data });
  return { ok: true, message: "Delivery area saved." };
}

export async function deleteRegion(id: string) {
  await requireAdmin();
  await prisma.deliveryRegion.delete({ where: { id } }).catch(() => null);
  return { ok: true, message: "Delivery area removed." };
}

// ───────── Admin users ─────────

export async function createAdmin(_: ActionState, f: FormData): Promise<ActionState> {
  await requireAdmin();
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(100),
      email: z.string().trim().toLowerCase().email(),
      password: z.string().min(12, "Use at least 12 characters.").max(128),
    })
    .safeParse(Object.fromEntries(f));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0].message, errors: { [String(parsed.error.issues[0].path[0])]: parsed.error.issues[0].message } };
  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
    return { ok: true, message: "Existing account promoted to admin (their password is unchanged)." };
  }
  await prisma.user.create({ data: { name: parsed.data.name, email: parsed.data.email, role: "ADMIN", passwordHash: await hashPassword(parsed.data.password) } });
  return { ok: true, message: "Admin account created." };
}

export async function revokeAdmin(id: string) {
  const me = await requireAdmin();
  if (id === me.id) return { ok: false, message: "You cannot remove your own admin access." };
  const admins = await prisma.user.count({ where: { role: "ADMIN" } });
  if (admins <= 1) return { ok: false, message: "At least one admin is required." };
  await prisma.user.update({ where: { id }, data: { role: "CUSTOMER" } });
  await prisma.session.deleteMany({ where: { userId: id } });
  return { ok: true, message: "Admin access removed." };
}
