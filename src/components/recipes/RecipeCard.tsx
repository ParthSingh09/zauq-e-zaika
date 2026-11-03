import Image from "next/image";
import Link from "next/link";
import { Clock, ArrowUpRight } from "lucide-react";
import type { RecipeCardData } from "@/lib/queries";
import { formatMinutes } from "@/lib/utils";
import { DietMark } from "@/components/ui/DietMark";
import { SampleBadge } from "@/components/ui/SampleBadge";

const FALLBACK = "/images/placeholders/curry.svg";

export function RecipeCard({ recipe, priority = false, headingLevel = "h3" }: { recipe: RecipeCardData; priority?: boolean; headingLevel?: "h2" | "h3" }) {
  const H = headingLevel;
  const total = recipe.prepMinutes + recipe.cookMinutes;
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] bg-card ring-1 ring-line/70 transition duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <Image
          src={recipe.image || FALLBACK}
          alt={recipe.imageAlt || recipe.title}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {recipe.category && (
            <span className="rounded-full bg-ivory/90 px-3 py-1 text-[11px] font-semibold tracking-wide text-ink backdrop-blur">
              {recipe.category.name}
            </span>
          )}
          {recipe.isSample && <SampleBadge />}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-4 text-xs text-muted">
          <DietMark diet={recipe.diet} withLabel />
          {total > 0 && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {formatMinutes(total)}
            </span>
          )}
        </div>
        <H className="text-xl leading-snug text-ink sm:text-[1.4rem]">
          <Link href={`/recipes/${recipe.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">
            {recipe.title}
          </Link>
        </H>
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-muted">{recipe.excerpt}</p>
        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-spice-deep">
          View Recipe
          <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
        </span>
      </div>
    </article>
  );
}
