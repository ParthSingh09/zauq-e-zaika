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
  social: { instagram: string; facebook: string; pinterest: string; x: string };
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
    text: "Freshly cooked in our Lucknow cloud kitchen — homemade with love.",
    linkLabel: "Explore our menu",
    linkHref: "/shop",
  },
  hero: {
    eyebrow: BRAND.tagline,
    title: "Authentic Flavours. Homemade with Love.",
    subtitle:
      "Discover delicious food and the warmth of homemade flavours with Zauq-e-Zaika.",
    primaryCtaLabel: "Explore Our Menu",
    primaryCtaHref: "/shop",
    secondaryCtaLabel: "Order Now",
    secondaryCtaHref: "/contact",
    image: "/images/placeholders/hero.svg",
    imageAlt: "A festive Indian thali with kheer, puri, dal, curry and sweets",
  },
  home: {
    introTitle: "Welcome to Zauq-e-Zaika",
    introBody:
      "Zauq means taste — the kind that comes from patience and a generous heart. Zaika is the flavour that stays with you long after the meal. Zauq-e-Zaika is a cloud kitchen in Lucknow, bringing both together in authentic Indian food, cooked the homemade way.",
    philosophyTitle: "More than food. It’s a feeling.",
    philosophyBody:
      "We cook the way homes cook — with patience, with care and with respect for tradition. Every dish that leaves our kitchen carries a little bit of love.",
    philosophyImage: "/images/placeholders/thali.svg",
    whyChoose: [
      { title: "Homemade flavour", body: "Food cooked the homemade way, with the warmth of a family kitchen." },
      { title: "Authentic taste", body: "Traditional Indian flavours, cooked the way they are meant to be." },
      { title: "Cooked with care", body: "Every dish is prepared with attention, patience and respect for the ingredients." },
      { title: "Homemade with love", body: "It is our name for how we cook — and our promise on every order." },
    ],
  },
  contact: {
    email: "",
    phone: "",
    whatsappNumber: "",
    whatsappMessage: "Hello Zauq-e-Zaika! I’d like to know more.",
    address: "",
    hours: "",
  },
  social: {
    instagram: BRAND.instagram,
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
