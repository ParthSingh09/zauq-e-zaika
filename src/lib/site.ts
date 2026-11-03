export const BRAND = {
  name: "Zauq-e-Zaika",
  tagline: "Homemade with Love",
  /** What the business is — used in titles and structured data. */
  type: "Cloud Kitchen",
  city: "Lucknow",
  region: "Uttar Pradesh",
  country: "IN",
  description:
    "Zauq-e-Zaika is a cloud kitchen in Lucknow, Uttar Pradesh — authentic Indian flavours, homemade with love.",
  instagram: "https://www.instagram.com/zauq.e.zaika?mdxt=MXI3eG5pNHFpMmw5NA==",
  instagramHandle: "@zauq.e.zaika",
} as const;

export const MAIN_NAV = [
  { href: "/recipes", label: "Recipes" },
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
