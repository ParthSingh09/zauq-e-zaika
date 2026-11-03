"use client";

import { useState } from "react";
import { Minus, Plus, Check } from "lucide-react";
import { formatQuantity, type Ingredient } from "@/lib/recipe-data";
import { cn } from "@/lib/utils";

/** Ingredient list with a servings adjuster (scales numeric quantities) and tick-off checkboxes. */
export function Ingredients({ ingredients, servings }: { ingredients: Ingredient[]; servings: number }) {
  const base = Math.max(1, servings);
  const [count, setCount] = useState(base);
  const [done, setDone] = useState<Set<number>>(new Set());
  const factor = count / base;
  const scalable = ingredients.some((i) => i.quantity !== null);

  const groups: { name?: string; items: { item: Ingredient; index: number }[] }[] = [];
  ingredients.forEach((item, index) => {
    const last = groups[groups.length - 1];
    if (last && last.name === item.group) last.items.push({ item, index });
    else groups.push({ name: item.group, items: [{ item, index }] });
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl text-ink">Ingredients</h2>
        {scalable && (
          <div className="flex items-center gap-1 rounded-full border border-line bg-card p-1" data-no-print>
            <button
              type="button"
              onClick={() => setCount((c) => Math.max(1, c - 1))}
              disabled={count <= 1}
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-sand disabled:opacity-40"
              aria-label="Decrease servings"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="min-w-24 text-center text-sm font-semibold text-ink" aria-live="polite">
              {count} {count === 1 ? "serving" : "servings"}
            </span>
            <button
              type="button"
              onClick={() => setCount((c) => Math.min(50, c + 1))}
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-sand"
              aria-label="Increase servings"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      {count !== base && (
        <p className="-mt-3 mb-4 text-xs text-muted" data-no-print>
          Quantities adjusted from the original {base} servings. Spices and cooking times may need tasting and adjusting.
        </p>
      )}
      {groups.map((g, gi) => (
        <div key={gi} className="mb-6 last:mb-0">
          {g.name && <h3 className="mb-3 font-sans text-xs font-semibold tracking-[0.18em] text-gold-deep uppercase">{g.name}</h3>}
          <ul className="divide-y divide-line/70">
            {g.items.map(({ item, index }) => {
              const checked = done.has(index);
              const qty = item.quantity === null ? "" : formatQuantity(item.quantity * factor);
              return (
                <li key={index}>
                  <label className="flex cursor-pointer items-start gap-3 py-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDone((s) => {
                          const n = new Set(s);
                          if (n.has(index)) n.delete(index);
                          else n.add(index);
                          return n;
                        })
                      }
                      className="peer sr-only"
                    />
                    <span
                      aria-hidden
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-spice-deep",
                        checked ? "border-veg bg-veg text-white" : "border-beige bg-card",
                      )}
                    >
                      {checked && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span className={cn("text-[16px] leading-snug transition", checked ? "text-muted line-through" : "text-cocoa")}>
                      {(qty || item.unit) && (
                        <strong className="font-semibold text-ink">
                          {[qty, item.unit].filter(Boolean).join(" ")}{" "}
                        </strong>
                      )}
                      {item.name}
                      {item.note && <span className="text-muted">, {item.note}</span>}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
