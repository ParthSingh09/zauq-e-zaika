import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChefHat, HeartHandshake, Leaf, Sparkles, Quote } from "lucide-react";
import { getSettings, whatsappLink } from "@/lib/settings";
import { prisma } from "@/lib/db";
import { getCategoriesWithCounts, getFeaturedProducts, getFeaturedRecipes, getPopularRecipes } from "@/lib/queries";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { ProductCard } from "@/components/shop/ProductCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { LogoMark } from "@/components/layout/Logo";
import { BRAND } from "@/lib/site";
import { formatMinutes } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 300;

export const metadata = {
  ...pageMetadata({ path: "/" }),
  title: { absolute: `${BRAND.name} — Cloud Kitchen in Lucknow | Homemade with Love` },
};

const WHY_ICONS = [ChefHat, HeartHandshake, Leaf, Sparkles];

export default async function HomePage() {
  const [settings, featured, popular, categories, products, testimonials] = await Promise.all([
    getSettings(),
    getFeaturedRecipes(3),
    getPopularRecipes(4),
    getCategoriesWithCounts(),
    getFeaturedProducts(4),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: { sortOrder: "asc" }, take: 3 }),
  ]);
  const { hero, home, shop, contact, social } = settings;
  const instagramUrl = social.instagram || BRAND.instagram;
  const spotlight = featured[0];
  const wa = whatsappLink(contact.whatsappNumber, contact.whatsappMessage);

  return (
    <>
      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden bg-ivory">
        <div className="pointer-events-none absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-gold/10 blur-3xl" />
        <div className="container-page relative grid items-center gap-12 pt-10 pb-16 lg:grid-cols-12 lg:gap-8 lg:pt-16 lg:pb-24">
          <div className="animate-fade-up lg:col-span-6">
            <p className="font-serif text-lg text-spice-deep italic sm:text-xl">{hero.eyebrow}</p>
            <h1 className="mt-4 text-[2.75rem] leading-[1.02] text-ink sm:text-6xl lg:text-[4.75rem]">{hero.title}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">{hero.subtitle}</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href={hero.primaryCtaHref} className="btn-primary px-8 py-3.5 text-[15px]">
                {hero.primaryCtaLabel} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href={hero.secondaryCtaHref} className="btn-outline px-8 py-3.5 text-[15px]">
                {hero.secondaryCtaLabel}
              </Link>
            </div>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-10 inline-flex items-center gap-3 text-sm text-muted transition hover:text-ink"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-spice/15 text-spice-deep transition group-hover:bg-spice-solid group-hover:text-white">
                <InstagramIcon className="h-5 w-5" />
              </span>
              <span>
                Follow us on Instagram <span className="font-semibold text-ink">{BRAND.instagramHandle}</span>
              </span>
            </a>
          </div>

          <div className="relative lg:col-span-6">
            <div className="relative mx-auto aspect-[6/7] w-full max-w-[520px] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-cream shadow-[var(--shadow-lift)] ring-8 ring-card">
              <Image src={hero.image} alt={hero.imageAlt} fill priority sizes="(min-width: 1024px) 520px, 90vw" className="object-cover" />
            </div>
            <div className="pointer-events-none absolute -top-4 right-2 hidden h-28 w-28 rounded-full border border-dashed border-gold/60 sm:block lg:right-6" />
            {spotlight && (
              <Link
                href={`/recipes/${spotlight.slug}`}
                className="group absolute -bottom-6 left-0 flex max-w-[290px] items-center gap-4 rounded-2xl bg-card/95 p-3 pr-5 shadow-[var(--shadow-lift)] ring-1 ring-line backdrop-blur transition hover:-translate-y-1 sm:left-4 lg:-left-6"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                  {spotlight.image && <Image src={spotlight.image} alt="" fill sizes="64px" className="object-cover" />}
                </span>
                <span className="min-w-0">
                  <span className="eyebrow block text-[10px]">Featured recipe</span>
                  <span className="mt-0.5 block truncate font-serif text-lg text-ink">{spotlight.title}</span>
                  <span className="text-xs text-muted">{formatMinutes(spotlight.prepMinutes + spotlight.cookMinutes)}</span>
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* ───────── Brand introduction ───────── */}
      <section className="border-y border-line bg-cream/60">
        <div className="container-page py-20 text-center sm:py-24">
          <div className="ornament mb-6" aria-hidden>
            <span className="text-xl">✦</span>
          </div>
          <h2 className="mx-auto max-w-3xl text-3xl text-ink sm:text-[2.6rem]">{home.introTitle}</h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-cocoa">{home.introBody}</p>
          <p className="mt-8 font-serif text-2xl text-spice-deep italic">{BRAND.tagline}</p>
        </div>
      </section>

      {/* ───────── Featured recipes ───────── */}
      {featured.length > 0 && (
        <section className="container-page py-20 sm:py-24" aria-labelledby="featured-heading">
          <SectionHeading
            id="featured-heading"
            eyebrow="From our kitchen"
            title="Featured Recipes"
            intro="Hand-picked favourites from the Zauq-e-Zaika kitchen — recipes written for home cooks."
            action={{ href: "/recipes", label: "All recipes" }}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} priority={i === 0} />
            ))}
          </div>
        </section>
      )}

      {/* ───────── Explore categories ───────── */}
      {categories.length > 0 && (
        <section className="bg-sand/50 py-20 sm:py-24" aria-labelledby="categories-heading">
          <div className="container-page">
            <SectionHeading id="categories-heading" eyebrow="Find your craving" title="Explore by Category" align="center" />
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/recipes/category/${c.slug}`}
                    className="group flex h-full flex-col items-center rounded-[var(--radius-card)] bg-ivory p-5 text-center ring-1 ring-line/70 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
                  >
                    <span className="relative mb-4 h-20 w-20 overflow-hidden rounded-full bg-cream ring-4 ring-cream transition group-hover:ring-gold/40 sm:h-24 sm:w-24">
                      {c.image && <Image src={c.image} alt="" fill sizes="96px" className="object-cover transition duration-500 group-hover:scale-110" />}
                    </span>
                    <span className="font-serif text-lg leading-tight text-ink">{c.name}</span>
                    <span className="mt-1 text-xs text-muted">
                      {c._count.recipes === 0 ? "Coming soon" : `${c._count.recipes} ${c._count.recipes === 1 ? "recipe" : "recipes"}`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* ───────── Popular homemade dishes ───────── */}
      {popular.length > 0 && (
        <section className="container-page py-20 sm:py-24" aria-labelledby="popular-heading">
          <SectionHeading
            id="popular-heading"
            eyebrow="Most loved"
            title="Popular Homemade Dishes"
            intro="The recipes our community cooks again and again."
            action={{ href: "/recipes?sort=popular", label: "See what’s popular" }}
          />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((r) => (
              <RecipeCard key={r.id} recipe={r} />
            ))}
          </div>
        </section>
      )}

      {/* ───────── Philosophy / About ───────── */}
      <section className="container-page grid items-center gap-12 py-20 sm:py-28 lg:grid-cols-2 lg:gap-20" aria-labelledby="philosophy-heading">
        <div className="relative order-2 lg:order-1">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[2rem] bg-cream">
            <Image src={home.philosophyImage} alt="A traditional Indian thali prepared at home" fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
          </div>
          <div className="absolute -right-3 -bottom-6 hidden rounded-2xl bg-spice-solid px-6 py-5 text-white shadow-[var(--shadow-lift)] sm:block">
            <p className="font-serif text-2xl italic">With love ♡</p>
            <p className="text-xs tracking-[0.2em] uppercase opacity-80">Homemade</p>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <p className="eyebrow mb-3">Our food philosophy</p>
          <h2 id="philosophy-heading" className="text-3xl text-ink sm:text-[2.75rem]">{home.philosophyTitle}</h2>
          <p className="mt-6 text-lg leading-relaxed text-cocoa">{home.philosophyBody}</p>
          <Link href="/about" className="btn-outline mt-8">
            Read our story <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* ───────── Featured products ───────── */}
      {shop.enabled && products.length > 0 && (
        <section className="bg-cream/70 py-20 sm:py-24" aria-labelledby="shop-heading">
          <div className="container-page">
            <SectionHeading
              id="shop-heading"
              eyebrow="From our kitchen"
              title="From Our Kitchen to Yours"
              intro="Discover what is cooking at Zauq-e-Zaika — homemade food, prepared with love."
              action={{ href: "/shop", label: "Visit the shop" }}
            />
            {!shop.checkoutEnabled && shop.notice && (
              <p className="mb-8 rounded-2xl border border-gold/40 bg-ivory px-5 py-4 text-sm text-cocoa">{shop.notice}</p>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────── Why choose us ───────── */}
      <section className="container-page py-20 sm:py-24" aria-labelledby="why-heading">
        <SectionHeading id="why-heading" eyebrow="Why Zauq-e-Zaika" title="Made the Way Homemade Food Should Be" align="center" />
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {home.whyChoose.map((item, i) => {
            const Icon = WHY_ICONS[i % WHY_ICONS.length];
            return (
              <li key={item.title} className="rounded-[var(--radius-card)] border border-line bg-card p-7 transition hover:border-gold/60 hover:shadow-[var(--shadow-soft)]">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold-deep">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-5 text-xl text-ink">{item.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────── Testimonials (real only) ───────── */}
      <section className="bg-sand/50 py-20 sm:py-24" aria-labelledby="testimonials-heading">
        <div className="container-page">
          {testimonials.length > 0 ? (
            <>
              <SectionHeading id="testimonials-heading" eyebrow="Kind words" title="From Our Community" align="center" />
              <div className="grid gap-6 md:grid-cols-3">
                {testimonials.map((t) => (
                  <figure key={t.id} className="flex flex-col rounded-[var(--radius-card)] bg-ivory p-8 ring-1 ring-line/70">
                    <Quote className="h-8 w-8 text-gold" aria-hidden />
                    <blockquote className="mt-4 flex-1 font-serif text-lg leading-relaxed text-ink">“{t.quote}”</blockquote>
                    <figcaption className="mt-6 text-sm">
                      <span className="font-semibold text-ink">{t.name}</span>
                      {t.location && <span className="text-muted"> · {t.location}</span>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          ) : (
            <div className="mx-auto max-w-2xl text-center">
              <Quote className="mx-auto h-10 w-10 text-gold" aria-hidden />
              <h2 id="testimonials-heading" className="mt-4 text-3xl text-ink sm:text-4xl">Cooked one of our recipes?</h2>
              <p className="mt-4 text-lg text-muted">
                We would love to hear how it turned out. Leave a rating on any recipe or write to us — your stories mean the world to our kitchen.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/recipes" className="btn-primary">Rate a recipe</Link>
                <Link href="/contact" className="btn-outline">Share your story</Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ───────── Instagram ───────── */}
      <section className="container-page py-20 sm:py-24" aria-labelledby="social-heading">
        <div className="grid items-center gap-10 overflow-hidden rounded-[2rem] bg-gradient-to-br from-nightsoft to-night p-8 text-paper sm:p-12 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <p className="eyebrow mb-3 text-gold">Join the family</p>
            <h2 id="social-heading" className="text-3xl sm:text-4xl">Follow Us on Instagram</h2>
            <p className="mt-4 max-w-lg text-paper/75">
              Discover our delicious creations, food updates and a little taste of Zauq-e-Zaika.
            </p>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="btn mt-8 bg-paper px-7 py-3.5 text-night hover:bg-gold">
              <InstagramIcon className="h-5 w-5" /> Follow Us on Instagram
            </a>
          </div>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${BRAND.instagramHandle} on Instagram`}
            className="group flex flex-col items-center rounded-3xl bg-white/5 p-8 text-center ring-1 ring-white/10 transition hover:bg-white/10 lg:col-span-2"
          >
            <LogoMark className="h-28 w-28 ring-4 ring-gold/40 transition group-hover:ring-gold" />
            <p className="mt-5 font-serif text-2xl">{BRAND.instagramHandle}</p>
            <p className="mt-1 text-xs tracking-[0.2em] text-paper/60 uppercase">{BRAND.tagline}</p>
          </a>
        </div>
      </section>

      {/* ───────── Newsletter ───────── */}
      <section className="border-t border-line bg-cream/60" aria-labelledby="newsletter-heading">
        <div className="container-page flex flex-col items-center py-20 text-center">
          <p className="font-serif text-xl text-spice-deep italic">{BRAND.tagline}</p>
          <h2 id="newsletter-heading" className="mt-3 max-w-2xl text-3xl text-ink sm:text-4xl">Get updates from our kitchen</h2>
          <p className="mt-4 mb-8 max-w-lg text-muted">One thoughtful email when there is something new from Zauq-e-Zaika. Unsubscribe anytime.</p>
          <NewsletterForm />
        </div>
      </section>

      {/* ───────── Contact strip ───────── */}
      <section className="container-page pt-20" aria-label="Contact">
        <div className="flex flex-col items-start justify-between gap-6 rounded-[var(--radius-card)] border border-line bg-card p-8 sm:flex-row sm:items-center sm:p-10">
          <div>
            <h2 className="text-2xl text-ink sm:text-3xl">Questions, orders or collaborations?</h2>
            <p className="mt-2 text-muted">We read every message and reply as soon as we can.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="btn-primary">Contact us</Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline">WhatsApp</a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
