import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Clock, Flame, Users, ChefHat, Lightbulb, Replace, Timer } from "lucide-react";
import { prisma } from "@/lib/db";
import { getRecipeBySlug, getRelatedRecipes } from "@/lib/queries";
import { asIngredients, asNutrition, asSteps, asStrings, ingredientLine } from "@/lib/recipe-data";
import { parseYouTubeId, youtubeEmbedUrl, youtubeThumb, youtubeWatchUrl } from "@/lib/youtube";
import { formatDate, formatMinutes, isoDuration, siteUrl } from "@/lib/utils";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { BRAND, DIFFICULTY_LABEL } from "@/lib/site";
import { Markdown } from "@/lib/markdown";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DietMark } from "@/components/ui/DietMark";
import { JsonLd } from "@/components/ui/JsonLd";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { Ingredients } from "@/components/recipes/Ingredients";
import { RecipeActions } from "@/components/recipes/RecipeActions";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ReviewForm } from "@/components/recipes/ReviewForm";
import { Stars } from "@/components/recipes/Stars";
import { VideoPlayer } from "@/components/video/VideoPlayer";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const rows = await prisma.recipe.findMany({ where: { published: true }, select: { slug: true }, take: 100 });
    return rows.map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const r = await getRecipeBySlug(slug);
  if (!r) notFound();
  return pageMetadata({
    title: r.seoTitle || `${r.title} Recipe`,
    description: r.seoDescription || r.excerpt,
    path: `/recipes/${r.slug}`,
    image: r.image && !r.image.endsWith(".svg") ? r.image : undefined,
    type: "article",
  });
}

export default async function RecipePage({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);
  if (!recipe) notFound();

  const ingredients = asIngredients(recipe.ingredients);
  const steps = asSteps(recipe.steps);
  const tips = asStrings(recipe.tips);
  const subs = asStrings(recipe.substitutions);
  const nutrition = asNutrition(recipe.nutrition);
  const videoId = parseYouTubeId(recipe.youtubeUrl);
  const total = recipe.prepMinutes + recipe.cookMinutes;
  const reviews = recipe.reviews;
  const ratingCount = reviews.length;
  const ratingAvg = ratingCount ? reviews.reduce((s, r) => s + r.rating, 0) / ratingCount : 0;
  const [related, linkedVideo] = await Promise.all([
    getRelatedRecipes(recipe.id, recipe.categoryId),
    videoId ? prisma.video.findUnique({ where: { youtubeId: videoId } }) : null,
  ]);

  // Structured data — only accurate, available fields are included.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Recipe",
    name: recipe.title,
    description: recipe.excerpt,
    ...(recipe.image ? { image: [absoluteUrl(recipe.image)] } : {}),
    author: { "@type": "Organization", name: BRAND.name, url: siteUrl("/") },
    ...(recipe.publishedAt ? { datePublished: recipe.publishedAt.toISOString() } : {}),
    ...(recipe.prepMinutes ? { prepTime: isoDuration(recipe.prepMinutes) } : {}),
    ...(recipe.cookMinutes ? { cookTime: isoDuration(recipe.cookMinutes) } : {}),
    ...(total ? { totalTime: isoDuration(total) } : {}),
    recipeYield: `${recipe.servings} servings`,
    ...(recipe.category ? { recipeCategory: recipe.category.name } : {}),
    ...(recipe.cuisine ? { recipeCuisine: recipe.cuisine } : {}),
    ...(recipe.tags.length ? { keywords: recipe.tags.join(", ") } : {}),
    ...(recipe.diet === "VEG" || recipe.diet === "VEGAN"
      ? { suitableForDiet: recipe.diet === "VEGAN" ? "https://schema.org/VeganDiet" : "https://schema.org/VegetarianDiet" }
      : {}),
    recipeIngredient: ingredients.map((i) => ingredientLine(i)),
    recipeInstructions: steps.map((s, i) => ({
      "@type": "HowToStep",
      ...(s.title ? { name: s.title } : {}),
      text: s.text,
      url: siteUrl(`/recipes/${recipe.slug}#step-${i + 1}`),
    })),
    ...(ratingCount
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: ratingAvg.toFixed(1), ratingCount } }
      : {}),
    ...(nutrition ? { nutrition: { "@type": "NutritionInformation", ...nutrition } } : {}),
    ...(videoId && linkedVideo?.publishedAt
      ? {
          video: {
            "@type": "VideoObject",
            name: linkedVideo.title,
            description: linkedVideo.description || recipe.excerpt,
            thumbnailUrl: youtubeThumb(videoId),
            embedUrl: youtubeEmbedUrl(videoId).split("?")[0],
            contentUrl: youtubeWatchUrl(videoId),
            uploadDate: linkedVideo.publishedAt.toISOString(),
          },
        }
      : {}),
  };

  const meta = [
    { icon: Timer, label: "Prep", value: formatMinutes(recipe.prepMinutes) },
    { icon: Flame, label: "Cook", value: formatMinutes(recipe.cookMinutes) },
    { icon: Clock, label: "Total", value: formatMinutes(total) },
    { icon: Users, label: "Serves", value: String(recipe.servings) },
    { icon: ChefHat, label: "Difficulty", value: DIFFICULTY_LABEL[recipe.difficulty] },
  ];

  return (
    <article>
      <JsonLd data={jsonLd} />

      {/* Header */}
      <header className="container-page pt-8 sm:pt-12">
        <Breadcrumbs
          items={[
            { name: "Home", path: "/" },
            { name: "Recipes", path: "/recipes" },
            ...(recipe.category ? [{ name: recipe.category.name, path: `/recipes/category/${recipe.category.slug}` }] : []),
            { name: recipe.title, path: `/recipes/${recipe.slug}` },
          ]}
        />
        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-5 lg:pt-6">
            <div className="flex flex-wrap items-center gap-3">
              {recipe.category && (
                <Link href={`/recipes/category/${recipe.category.slug}`} className="eyebrow hover:text-ink">
                  {recipe.category.name}
                </Link>
              )}
              <DietMark diet={recipe.diet} withLabel />
              {recipe.isSample && <SampleBadge />}
            </div>
            <h1 className="mt-4 text-4xl text-ink sm:text-5xl lg:text-6xl">{recipe.title}</h1>
            <p className="mt-5 text-lg leading-relaxed text-muted">{recipe.excerpt}</p>
            {ratingCount > 0 && (
              <a href="#reviews" className="mt-5 inline-flex items-center gap-2 text-sm text-muted hover:text-ink">
                <Stars value={ratingAvg} /> {ratingAvg.toFixed(1)} · {ratingCount} {ratingCount === 1 ? "review" : "reviews"}
              </a>
            )}
            <dl className="mt-8 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="bg-card px-3 py-4 text-center last:col-span-2 sm:last:col-span-1 lg:last:col-span-2 xl:last:col-span-1">
                  <Icon className="mx-auto h-4 w-4 text-gold-deep" aria-hidden />
                  <dt className="mt-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">
              <RecipeActions recipeId={recipe.id} slug={recipe.slug} title={recipe.title} />
            </div>
          </div>
          <div className="lg:col-span-7">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-cream shadow-[var(--shadow-soft)]">
              <Image
                src={recipe.image || "/images/placeholders/curry.svg"}
                alt={recipe.imageAlt || recipe.title}
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Introduction */}
      {recipe.intro && (
        <section className="container-page mt-14 max-w-3xl">
          <div className="prose-zz">
            <Markdown source={recipe.intro} />
          </div>
        </section>
      )}

      {/* Ingredients + method */}
      <div className="container-page mt-14 grid gap-12 lg:grid-cols-12">
        <aside className="lg:col-span-4">
          <div className="rounded-[var(--radius-card)] bg-cream/70 p-6 ring-1 ring-line/70 sm:p-8 lg:sticky lg:top-24">
            {ingredients.length ? <Ingredients ingredients={ingredients} servings={recipe.servings} /> : <p className="text-muted">Ingredients coming soon.</p>}
          </div>
        </aside>

        <div className="lg:col-span-8">
          {videoId && (
            <section className="mb-14" aria-labelledby="video-heading" data-no-print>
              <h2 id="video-heading" className="mb-5 text-3xl text-ink">Watch how it’s made</h2>
              <VideoPlayer id={videoId} title={`${recipe.title} — video recipe`} />
              <a href={youtubeWatchUrl(videoId)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-medium text-spice-deep hover:underline">
                Watch on YouTube →
              </a>
            </section>
          )}

          <section aria-labelledby="method-heading">
            <h2 id="method-heading" className="mb-6 text-3xl text-ink">Method</h2>
            <ol className="space-y-8">
              {steps.map((s, i) => (
                <li key={i} id={`step-${i + 1}`} className="grid scroll-mt-28 grid-cols-[auto_1fr] gap-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink font-serif text-lg text-ivory" aria-hidden>
                    {i + 1}
                  </span>
                  <div className="pt-1.5">
                    {s.title && <h3 className="mb-1.5 text-xl text-ink">{s.title}</h3>}
                    <p className="text-[17px] leading-relaxed text-cocoa">
                      <span className="sr-only">Step {i + 1}: </span>
                      {s.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {(tips.length > 0 || subs.length > 0) && (
            <div className="mt-14 grid gap-6 md:grid-cols-2">
              {tips.length > 0 && (
                <section className="rounded-[var(--radius-card)] border border-gold/40 bg-gold/5 p-6">
                  <h2 className="flex items-center gap-2 text-2xl text-ink">
                    <Lightbulb className="h-5 w-5 text-gold-deep" aria-hidden /> Cooking tips
                  </h2>
                  <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-cocoa">
                    {tips.map((t, i) => (
                      <li key={i} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{t}</li>
                    ))}
                  </ul>
                </section>
              )}
              {subs.length > 0 && (
                <section className="rounded-[var(--radius-card)] border border-line bg-card p-6">
                  <h2 className="flex items-center gap-2 text-2xl text-ink">
                    <Replace className="h-5 w-5 text-spice-deep" aria-hidden /> Substitutions
                  </h2>
                  <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-cocoa">
                    {subs.map((t, i) => (
                      <li key={i} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-spice" />{t}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          )}

          {nutrition && (
            <section className="mt-14" aria-labelledby="nutrition-heading">
              <h2 id="nutrition-heading" className="text-2xl text-ink">Nutrition (per serving, approximate)</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {Object.entries(nutrition).map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-line bg-card p-4">
                    <dt className="text-xs text-muted capitalize">{k.replace(/Content$/, "").replace(/([A-Z])/g, " $1")}</dt>
                    <dd className="mt-1 font-semibold text-ink">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Reviews */}
          <section id="reviews" className="mt-16 scroll-mt-28 border-t border-line pt-12" aria-labelledby="reviews-heading" data-no-print>
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <h2 id="reviews-heading" className="text-3xl text-ink">Ratings & reviews</h2>
              {ratingCount > 0 && (
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Stars value={ratingAvg} /> {ratingAvg.toFixed(1)} average from {ratingCount}
                </p>
              )}
            </div>
            <ReviewForm recipeId={recipe.id} slug={recipe.slug} />
            {reviews.length > 0 ? (
              <ul className="mt-8 space-y-6">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b border-line/70 pb-6 last:border-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sand font-serif text-ink">{r.user.name.charAt(0).toUpperCase()}</span>
                      <span className="font-semibold text-ink">{r.user.name.split(" ")[0]}</span>
                      <Stars value={r.rating} />
                      <time className="text-xs text-muted" dateTime={r.createdAt.toISOString()}>{formatDate(r.createdAt)}</time>
                    </div>
                    {r.comment && <p className="mt-3 leading-relaxed text-cocoa">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 text-sm text-muted">No reviews yet — be the first to share how it turned out.</p>
            )}
          </section>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="container-page mt-24" aria-labelledby="related-heading" data-no-print>
          <h2 id="related-heading" className="mb-8 text-3xl text-ink sm:text-4xl">You may also love</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
