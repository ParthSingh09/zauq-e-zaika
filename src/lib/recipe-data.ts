// Shared (client + server) recipe data helpers.
export type Ingredient = { group?: string; name: string; quantity: number | null; unit: string; note?: string };
export type Step = { title?: string; text: string };
export type Nutrition = Record<string, string>;

export function asIngredients(v: unknown): Ingredient[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x && typeof x === "object" && typeof (x as Ingredient).name === "string")
    .map((x) => {
      const i = x as Ingredient;
      const q = typeof i.quantity === "number" && Number.isFinite(i.quantity) ? i.quantity : null;
      return { group: i.group || undefined, name: i.name, quantity: q, unit: i.unit ?? "", note: i.note || undefined };
    });
}

export function asSteps(v: unknown): Step[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x) => x && typeof x === "object" && typeof (x as Step).text === "string")
    .map((x) => ({ title: (x as Step).title || undefined, text: (x as Step).text }));
}

export function asStrings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
}

export function asNutrition(v: unknown): Nutrition | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const entries = Object.entries(v as Record<string, unknown>).filter(
    ([, val]) => typeof val === "string" && val.trim() !== "",
  ) as [string, string][];
  return entries.length ? Object.fromEntries(entries) : null;
}

const FRACTIONS: [number, string][] = [
  [0.125, "⅛"], [0.25, "¼"], [0.333, "⅓"], [0.5, "½"], [0.667, "⅔"], [0.75, "¾"],
];

/** Formats scaled quantities in a kitchen-friendly way: 1.5 → "1½", 0.33 → "⅓". */
export function formatQuantity(q: number | null) {
  if (q === null) return "";
  if (q >= 10) return String(Math.round(q));
  const whole = Math.floor(q);
  const frac = q - whole;
  if (frac < 0.06) return String(whole || (q > 0 ? "a pinch of" : "0"));
  if (frac > 0.94) return String(whole + 1);
  const match = FRACTIONS.find(([v]) => Math.abs(frac - v) < 0.05);
  if (match) return `${whole || ""}${match[1]}`;
  return (Math.round(q * 10) / 10).toString();
}

export function ingredientLine(i: Ingredient, factor = 1) {
  const q = i.quantity === null ? "" : formatQuantity(i.quantity * factor);
  return [q, i.unit, i.name].filter(Boolean).join(" ") + (i.note ? `, ${i.note}` : "");
}
