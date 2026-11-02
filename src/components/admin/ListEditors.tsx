"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import type { Ingredient, Step } from "@/lib/recipe-data";

function move<T>(arr: T[], i: number, d: -1 | 1) {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
}

const iconBtn = "rounded-lg p-1.5 text-muted hover:bg-sand hover:text-ink disabled:opacity-30";

type IngRow = { group: string; quantity: string; unit: string; name: string; note: string };

export function IngredientsEditor({ defaultValue, error }: { defaultValue: Ingredient[]; error?: string }) {
  const [rows, setRows] = useState<IngRow[]>(
    defaultValue.length
      ? defaultValue.map((i) => ({ group: i.group ?? "", quantity: i.quantity === null ? "" : String(i.quantity), unit: i.unit, name: i.name, note: i.note ?? "" }))
      : [{ group: "", quantity: "", unit: "", name: "", note: "" }],
  );
  const serialised = rows
    .filter((r) => r.name.trim())
    .map((r) => {
      const q = r.quantity.trim() === "" ? null : Number(r.quantity.replace(",", "."));
      return { group: r.group.trim() || undefined, quantity: Number.isFinite(q as number) ? q : null, unit: r.unit.trim(), name: r.name.trim(), note: r.note.trim() || undefined };
    });
  const set = (i: number, k: keyof IngRow, v: string) => setRows((all) => all.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div>
      <input type="hidden" name="ingredients" value={JSON.stringify(serialised)} />
      <div className="hidden grid-cols-[7rem_5rem_6rem_1fr_9rem_auto] gap-2 px-1 pb-1 text-[11px] font-semibold tracking-wide text-muted uppercase md:grid">
        <span>Group</span><span>Qty</span><span>Unit</span><span>Ingredient</span><span>Note</span><span />
      </div>
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-line p-2 md:grid-cols-[7rem_5rem_6rem_1fr_9rem_auto] md:border-0 md:p-0">
            <input value={r.group} onChange={(e) => set(i, "group", e.target.value)} placeholder="Group (optional)" aria-label={`Ingredient ${i + 1} group`} className="field py-2 text-sm" />
            <input value={r.quantity} onChange={(e) => set(i, "quantity", e.target.value)} placeholder="1.5" inputMode="decimal" aria-label={`Ingredient ${i + 1} quantity`} className="field py-2 text-sm" />
            <input value={r.unit} onChange={(e) => set(i, "unit", e.target.value)} placeholder="cup" aria-label={`Ingredient ${i + 1} unit`} className="field py-2 text-sm" />
            <input value={r.name} onChange={(e) => set(i, "name", e.target.value)} placeholder="Ingredient name" aria-label={`Ingredient ${i + 1} name`} className="field col-span-2 py-2 text-sm md:col-span-1" />
            <input value={r.note} onChange={(e) => set(i, "note", e.target.value)} placeholder="e.g. chopped" aria-label={`Ingredient ${i + 1} note`} className="field py-2 text-sm" />
            <div className="flex items-center justify-end">
              <button type="button" className={iconBtn} onClick={() => setRows((a) => move(a, i, -1))} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" className={iconBtn} onClick={() => setRows((a) => move(a, i, 1))} disabled={i === rows.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" className={iconBtn} onClick={() => setRows((a) => a.filter((_, j) => j !== i))} aria-label="Remove ingredient"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
      <button type="button" onClick={() => setRows((a) => [...a, { group: a[a.length - 1]?.group ?? "", quantity: "", unit: "", name: "", note: "" }])} className="btn-outline btn-sm mt-3">
        <Plus className="h-4 w-4" /> Add ingredient
      </button>
      <p className="field-hint">Leave quantity empty for “to taste” items. Numeric quantities scale automatically when visitors change servings.</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function StepsEditor({ defaultValue, error }: { defaultValue: Step[]; error?: string }) {
  const [rows, setRows] = useState<{ title: string; text: string }[]>(
    defaultValue.length ? defaultValue.map((s) => ({ title: s.title ?? "", text: s.text })) : [{ title: "", text: "" }],
  );
  const serialised = rows.filter((r) => r.text.trim()).map((r) => ({ title: r.title.trim() || undefined, text: r.text.trim() }));
  const set = (i: number, k: "title" | "text", v: string) => setRows((all) => all.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <input type="hidden" name="steps" value={JSON.stringify(serialised)} />
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-semibold text-ivory">{i + 1}</span>
            <div className="flex-1 space-y-2">
              <input value={r.title} onChange={(e) => set(i, "title", e.target.value)} placeholder="Step title (optional)" aria-label={`Step ${i + 1} title`} className="field py-2 text-sm" />
              <textarea value={r.text} onChange={(e) => set(i, "text", e.target.value)} rows={3} placeholder="Describe this step…" aria-label={`Step ${i + 1} instructions`} className="field text-sm" />
            </div>
            <div className="flex flex-col">
              <button type="button" className={iconBtn} onClick={() => setRows((a) => move(a, i, -1))} disabled={i === 0} aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" className={iconBtn} onClick={() => setRows((a) => move(a, i, 1))} disabled={i === rows.length - 1} aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" className={iconBtn} onClick={() => setRows((a) => a.filter((_, j) => j !== i))} aria-label="Remove step"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ol>
      <button type="button" onClick={() => setRows((a) => [...a, { title: "", text: "" }])} className="btn-outline btn-sm mt-3"><Plus className="h-4 w-4" /> Add step</button>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

type VariantRow = { id?: string; name: string; price: string; stock: string; sku: string };
export function VariantsEditor({ defaultValue, error, trackStockHint }: { defaultValue: VariantRow[]; error?: string; trackStockHint?: boolean }) {
  const [rows, setRows] = useState<VariantRow[]>(defaultValue);
  const set = (i: number, k: keyof VariantRow, v: string) => setRows((all) => all.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  return (
    <div>
      <input type="hidden" name="variants" value={JSON.stringify(rows.filter((r) => r.name.trim()))} />
      {rows.length > 0 && (
        <ul className="space-y-2">
          {rows.map((r, i) => (
            <li key={r.id ?? i} className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_7rem_6rem_8rem_auto]">
              <input value={r.name} onChange={(e) => set(i, "name", e.target.value)} placeholder="e.g. 500 g" aria-label={`Option ${i + 1} name`} className="field py-2 text-sm" />
              <input value={r.price} onChange={(e) => set(i, "price", e.target.value)} placeholder="Price ₹" inputMode="decimal" aria-label={`Option ${i + 1} price`} className="field py-2 text-sm" />
              <input value={r.stock} onChange={(e) => set(i, "stock", e.target.value)} placeholder="Stock" inputMode="numeric" aria-label={`Option ${i + 1} stock`} className="field py-2 text-sm" />
              <input value={r.sku} onChange={(e) => set(i, "sku", e.target.value)} placeholder="SKU (optional)" aria-label={`Option ${i + 1} SKU`} className="field py-2 text-sm" />
              <button type="button" className={iconBtn} onClick={() => setRows((a) => a.filter((_, j) => j !== i))} aria-label="Remove option"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setRows((a) => [...a, { name: "", price: "", stock: "0", sku: "" }])} className="btn-outline btn-sm mt-3"><Plus className="h-4 w-4" /> Add option (size / weight)</button>
      <p className="field-hint">Options override the base price. {trackStockHint && "Stock is tracked per option when “Track stock” is on."}</p>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
