export const BRAND = {
  name: "Zauq e Zaika",
  tagline: "Har Zaika, Dil Se ♡",
  description:
    "Authentic homemade Indian recipes, traditional family flavours, cooking videos and homemade food — made with love by Zauq e Zaika.",
  youtube: "https://www.youtube.com/@ZauqeZaika",
  youtubeHandle: "@ZauqeZaika",
} as const;

export const MAIN_NAV = [
  { href: "/recipes", label: "Recipes" },
  { href: "/videos", label: "Videos" },
  { href: "/shop", label: "Shop" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export const RECIPE_DIET_LABEL = {
  VEG: "Vegetarian",
  NON_VEG: "Non-vegetarian",
  EGG: "Contains egg",
  VEGAN: "Vegan",
} as const;

export const DIFFICULTY_LABEL = { EASY: "Easy", MEDIUM: "Medium", HARD: "Challenging" } as const;

export const ORDER_STATUS_LABEL = {
  PENDING: "Order received",
  CONFIRMED: "Confirmed",
  PREPARING: "Being prepared",
  OUT_FOR_DELIVERY: "Out for delivery",
  READY_FOR_PICKUP: "Ready for pickup",
  DELIVERED: "Completed",
  CANCELLED: "Cancelled",
} as const;

export const PAYMENT_STATUS_LABEL = {
  UNPAID: "Unpaid",
  PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
} as const;

export const POLICY_PAGES = [
  { slug: "privacy-policy", label: "Privacy Policy" },
  { slug: "terms-and-conditions", label: "Terms & Conditions" },
  { slug: "shipping-and-delivery", label: "Shipping & Delivery" },
  { slug: "returns-and-refunds", label: "Returns & Refunds" },
  { slug: "cancellation-policy", label: "Cancellation Policy" },
  { slug: "cookie-policy", label: "Cookie Policy" },
] as const;
