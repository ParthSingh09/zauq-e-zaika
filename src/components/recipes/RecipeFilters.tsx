"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";
import { Search, X } from "lucide-react";
import type { RecipeFilters as F } from "@/lib/queries";

type Option = { value: string; label: string };

/**
 * A plain GET form (works without JavaScript); with JS, select changes apply instantly.
 */
export function RecipeFilters({
  action,
  filters,
  categories,
  cuisines,
  hideCategory,
}: {
  action: string;
  filters: F;
  categories: Option[];
  cuisines: string[];
  hideCategory?: boolean;
}) {
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const submit = () => {
    if (!form.current) return;
    const data = new FormData(form.current);
    const params = new URLSearchParams();
    for (const [k, v] of data) if (typeof v === "string" && v) params.set(k, v);
    router.push(`${action}${params.size ? `?${params}` : ""}#results`, { scroll: false });
  };
  const active = Boolean(filters.q || filters.category || filters.cuisine || filters.diet || filters.time || filters.difficulty);

  const sel = "field cursor-pointer rounded-full py-2 pr-9 text-sm";
  return (
    <form
      ref={form}
      action={action}
      method="get"
      role="search"
      aria-label="Search and filter recipes"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div id="search" className="relative scroll-mt-28">
        <label htmlFor="recipe-q" className="sr-only">Search recipes</label>
        <Search className="pointer-events-none absolute top-1/2 left-5 h-5 w-5 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id="recipe-q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Search recipes — try “kheer”, “paratha” or “chai”"
          className="field h-14 rounded-full pr-32 pl-13 text-base shadow-[var(--shadow-soft)]"
          maxLength={100}
        />
        <button type="submit" className="btn-primary absolute top-1.5 right-1.5 h-11 px-6">Search</button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {!hideCategory && (
          <FilterSelect label="Category" name="category" value={filters.category} onChange={submit} className={sel}
            options={[{ value: "", label: "All categories" }, ...categories]} />
        )}
        {cuisines.length > 0 && (
          <FilterSelect label="Cuisine" name="cuisine" value={filters.cuisine} onChange={submit} className={sel}
            options={[{ value: "", label: "All cuisines" }, ...cuisines.map((c) => ({ value: c, label: c }))]} />
        )}
        <FilterSelect label="Diet" name="diet" value={filters.diet} onChange={submit} className={sel}
          options={[{ value: "", label: "Veg & non-veg" }, { value: "VEG", label: "Vegetarian" }, { value: "VEGAN", label: "Vegan" }, { value: "EGG", label: "Contains egg" }, { value: "NON_VEG", label: "Non-vegetarian" }]} />
        <FilterSelect label="Total time" name="time" value={filters.time} onChange={submit} className={sel}
          options={[{ value: "", label: "Any time" }, { value: "15", label: "15 min or less" }, { value: "30", label: "30 min or less" }, { value: "60", label: "1 hour or less" }, { value: "61", label: "Over 1 hour" }]} />
        <FilterSelect label="Difficulty" name="difficulty" value={filters.difficulty} onChange={submit} className={sel}
          options={[{ value: "", label: "Any difficulty" }, { value: "EASY", label: "Easy" }, { value: "MEDIUM", label: "Medium" }, { value: "HARD", label: "Challenging" }]} />
        <span className="hidden flex-1 sm:block" />
        <FilterSelect label="Sort by" name="sort" value={filters.sort} onChange={submit} className={sel}
          options={[{ value: "", label: "Newest" }, { value: "popular", label: "Most popular" }, { value: "quickest", label: "Quickest" }]} />
        {active && (
          <button type="button" onClick={() => router.push(`${action}#results`, { scroll: false })} className="btn-ghost btn-sm text-spice-deep">
            <X className="h-3.5 w-3.5" /> Clear filters
          </button>
        )}
      </div>
      <noscript>
        <button type="submit" className="btn-outline btn-sm">Apply filters</button>
      </noscript>
    </form>
  );
}

function FilterSelect({ label, name, value, options, onChange, className }: { label: string; name: string; value?: string; options: Option[]; onChange: () => void; className: string }) {
  return (
    <div className="w-[calc(50%-0.4rem)] sm:w-auto">
      <label htmlFor={`flt-${name}`} className="sr-only">{label}</label>
      <select id={`flt-${name}`} name={name} defaultValue={value ?? ""} onChange={onChange} className={className}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
