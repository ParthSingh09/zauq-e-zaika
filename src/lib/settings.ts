import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";
import { BRAND } from "./site";

/**
 * All editable site-wide content and configuration lives here, stored in the
 * SiteSetting table as one JSON document per group. Defaults are used for any
 * field the admin has not set yet, so the site always renders.
 */
export type Settings = {
  announcement: { enabled: boolean; text: string; linkLabel: string; linkHref: string };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    image: string;
    imageAlt: string;
  };
  home: {
    introTitle: string;
    introBody: string;
    philosophyTitle: string;
    philosophyBody: string;
    philosophyImage: string;
    whyChoose: { title: string; body: string }[];
  };
  contact: {
    email: string;
    phone: string;
    whatsappNumber: string;
    whatsappMessage: string;
    address: string;
    hours: string;
  };
  social: { youtube: string; instagram: string; facebook: string; pinterest: string; x: string };
  shop: {
    /** Show the shop to visitors. */
    enabled: boolean;
    /** Allow customers to place orders. Keep off until business details & policies are ready. */
    checkoutEnabled: boolean;
    notice: string;
    allowDelivery: boolean;
    allowPickup: boolean;
    pickupAddress: string;
    pickupInstructions: string;
    allowPayOnDelivery: boolean;
    /** Online payments also require Razorpay keys in environment variables. */
    razorpayEnabled: boolean;
    preparationTime: string;
    orderCutoff: string;
    minOrderPaise: number;
  };
};

export const DEFAULT_SETTINGS: Settings = {
  announcement: {
    enabled: true,
    text: "New recipes every week on our YouTube channel — cooked with love, shared with you.",
    linkLabel: "Watch now",
    linkHref: "/videos",
  },
  hero: {
    eyebrow: BRAND.tagline,
    title: "Every Flavour Tells a Story.",
    subtitle:
      "Discover authentic homemade recipes, traditional Indian flavours and delicious creations made with love.",
    primaryCtaLabel: "Explore Recipes",
    primaryCtaHref: "/recipes",
    secondaryCtaLabel: "Discover Our Kitchen",
    secondaryCtaHref: "/about",
    image: "/images/placeholders/hero.svg",
    imageAlt: "A festive Indian thali with kheer, puri, dal, curry and sweets",
  },
  home: {
    introTitle: "Welcome to Zauq e Zaika",
    introBody:
      "Zauq means taste — the kind that comes from patience, practice and a generous heart. Zaika is the flavour that stays with you long after the meal. Here, we bring both together: traditional Indian family recipes, cooked at home and shared with everyone who loves good food.",
    philosophyTitle: "More than food. It’s a feeling.",
    philosophyBody:
      "We cook the way our families taught us — slowly, honestly and with ingredients we trust. Every recipe is tested in a home kitchen, every video is made to help you cook with confidence, and every dish carries a little bit of love.",
    philosophyImage: "/images/placeholders/thali.svg",
    whyChoose: [
      { title: "Homemade, always", body: "Recipes and food made in a real home kitchen, in small batches, the traditional way." },
      { title: "Family recipes", body: "Flavours passed down through generations, written down so you can recreate them." },
      { title: "Honest ingredients", body: "Simple, wholesome ingredients — no shortcuts that compromise taste." },
      { title: "Made with love", body: "Har Zaika, Dil Se. Every dish is cooked the way we would cook for our own family." },
    ],
  },
  contact: {
    email: "",
    phone: "",
    whatsappNumber: "",
    whatsappMessage: "Hello Zauq e Zaika! I have a question.",
    address: "",
    hours: "",
  },
  social: {
    youtube: BRAND.youtube,
    instagram: "",
    facebook: "",
    pinterest: "",
    x: "",
  },
  shop: {
    enabled: true,
    checkoutEnabled: false,
    notice:
      "Our kitchen is preparing to open for orders. Products shown are demonstrations only — ordering will open soon.",
    allowDelivery: true,
    allowPickup: false,
    pickupAddress: "",
    pickupInstructions: "",
    allowPayOnDelivery: true,
    razorpayEnabled: false,
    preparationTime: "",
    orderCutoff: "",
    minOrderPaise: 0,
  },
};

export type SettingsKey = keyof Settings;
export const SETTINGS_TAG = "settings";

async function loadSettings(): Promise<Settings> {
  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await prisma.siteSetting.findMany();
  } catch (err) {
    console.error("Failed to load settings, using defaults", err);
  }
  const merged = structuredClone(DEFAULT_SETTINGS) as Record<string, unknown>;
  for (const row of rows) {
    if (row.key in merged && row.value && typeof row.value === "object") {
      merged[row.key] = { ...(merged[row.key] as object), ...(row.value as object) };
    }
  }
  return merged as Settings;
}

export const getSettings = unstable_cache(loadSettings, ["site-settings"], {
  tags: [SETTINGS_TAG],
  revalidate: 3600,
});

export async function saveSettings<K extends SettingsKey>(key: K, value: Settings[K]) {
  await prisma.siteSetting.upsert({
    where: { key },
    create: { key, value: value as object },
    update: { value: value as object },
  });
}

export function whatsappLink(number: string, message?: string) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}
