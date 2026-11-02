const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });

export function formatPaise(paise: number) {
  const value = paise / 100;
  return Number.isInteger(value) ? inr.format(value).replace(/\.00$/, "") : inr.format(value);
}

/** Parses a rupee amount typed by an admin ("249", "249.50") into integer paise. */
export function rupeesToPaise(input: string | number | null | undefined) {
  if (input === null || input === undefined || input === "") return null;
  const n = typeof input === "number" ? input : Number(String(input).replace(/[,₹\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function paiseToRupeesString(paise: number | null | undefined) {
  if (paise === null || paise === undefined) return "";
  return (paise / 100).toString();
}
