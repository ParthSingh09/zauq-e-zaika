import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { getSettings } from "@/lib/settings";
import { Markdown } from "@/lib/markdown";
import { pageMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/site";
import { ReviewNotice } from "@/components/ui/ReviewNotice";
import { InstagramIcon } from "@/components/ui/SocialIcons";

export const revalidate = 3600;
export const metadata = pageMetadata({
  title: "About Us — Our Story",
  description: "The story behind Zauq-e-Zaika, a cloud kitchen in Lucknow: authentic Indian flavours, homemade with love.",
  path: "/about",
});

export default async function AboutPage() {
  const [page, settings] = await Promise.all([getPage("about"), getSettings()]);
  if (!page) notFound();
  return (
    <>
      <section className="relative overflow-hidden bg-cream/70">
        <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-2">
          <div>
            <p className="font-serif text-xl text-spice-deep italic">{BRAND.tagline}</p>
            <h1 className="mt-4 text-5xl leading-[1.05] text-ink sm:text-6xl lg:text-7xl">{page.title}</h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{settings.home.philosophyBody}</p>
          </div>
          <div className="relative">
            <div className="relative mx-auto aspect-[4/5] max-w-md overflow-hidden rounded-t-[999px] rounded-b-[2rem] ring-8 ring-card shadow-[var(--shadow-lift)]">
              <Image src="/images/placeholders/kheer-puri.svg" alt="Homemade kheer and puri — brand photograph placeholder" fill priority sizes="(min-width:1024px) 28rem, 90vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <div className="container-page grid gap-14 py-16 sm:py-24 lg:grid-cols-12">
        <article className="lg:col-span-7">
          {page.needsReview && <ReviewNotice kind="content" />}
          <div className="prose-zz"><Markdown source={page.body} /></div>
        </article>
        <aside className="space-y-6 lg:col-span-5">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-cream">
            <Image src="/images/placeholders/thali.svg" alt="A traditional homemade thali — brand photograph placeholder" fill sizes="(min-width:1024px) 35vw, 90vw" className="object-cover" />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-cream">
              <Image src="/images/placeholders/sweets.svg" alt="Homemade sweets — placeholder" fill sizes="20vw" className="object-cover" />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-cream">
              <Image src="/images/placeholders/chai-snacks.svg" alt="Chai and snacks — placeholder" fill sizes="20vw" className="object-cover" />
            </div>
          </div>
        </aside>
      </div>

      <section className="container-page">
        <div className="flex flex-col items-center rounded-[2rem] bg-night px-6 py-16 text-center text-paper">
          <h2 className="max-w-2xl text-3xl sm:text-4xl">Taste the homemade difference</h2>
          <p className="mt-4 max-w-lg text-paper/70">Explore our menu, follow our kitchen on Instagram, or bring a little of our flavours home.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/shop" className="btn bg-paper text-night hover:bg-gold">Explore our menu</Link>
            <a href={BRAND.instagram} target="_blank" rel="noopener noreferrer" className="btn border border-white/25 text-paper hover:bg-white/10">
              <InstagramIcon className="h-4 w-4" /> Follow on Instagram
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
