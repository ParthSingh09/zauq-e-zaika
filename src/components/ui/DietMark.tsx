import { cn } from "@/lib/utils";
import { RECIPE_DIET_LABEL } from "@/lib/site";

type Diet = keyof typeof RECIPE_DIET_LABEL;

/** Indian-style veg / non-veg indicator (square with dot / triangle). */
export function DietMark({ diet, withLabel, className }: { diet: Diet; withLabel?: boolean; className?: string }) {
  const nonVeg = diet === "NON_VEG" || diet === "EGG";
  const color = nonVeg ? "var(--color-nonveg)" : "var(--color-veg)";
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", className)} title={RECIPE_DIET_LABEL[diet]}>
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" role="img" aria-label={RECIPE_DIET_LABEL[diet]}>
        <rect x="1" y="1" width="14" height="14" rx="2" fill="#fff" stroke={color} strokeWidth="1.6" />
        {nonVeg ? <path d="M8 4.2 11.6 11H4.4z" fill={color} /> : <circle cx="8" cy="8" r="3.4" fill={color} />}
      </svg>
      {withLabel && <span style={{ color }}>{RECIPE_DIET_LABEL[diet]}</span>}
    </span>
  );
}
