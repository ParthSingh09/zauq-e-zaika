import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getVideos } from "@/lib/queries";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { EmptyState } from "@/components/ui/EmptyState";
import { JsonLd } from "@/components/ui/JsonLd";
import { YoutubeIcon } from "@/components/ui/SocialIcons";
import { BRAND } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";
import { youtubeThumb, youtubeWatchUrl } from "@/lib/youtube";

export const revalidate = 300;

export const metadata = pageMetadata({
  title: "Cooking Videos",
  description: "Watch step-by-step Indian cooking videos from the Zauq e Zaika kitchen — traditional recipes made simple.",
  path: "/videos",
});

export default async function VideosPage() {
  const videos = await getVideos();
  const [lead, ...rest] = videos;

  return (
    <>
      <section className="relative overflow-hidden bg-ink text-ivory">
        <div className="pointer-events-none absolute -right-24 -bottom-24 h-80 w-80 rounded-full bg-gold/15 blur-3xl" />
        <div className="container-page relative flex flex-col gap-8 py-16 sm:py-20 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow mb-3 text-gold">The video kitchen</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl">Cook Along with Us</h1>
            <p className="mt-5 text-lg text-ivory/75">
              Every recipe, shown step by step from our home kitchen. Press play, grab your kadhai and let’s cook together.
            </p>
          </div>
          <a href={`${BRAND.youtube}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="btn shrink-0 bg-[#CC0000] px-7 py-3.5 text-white hover:bg-[#A80000]">
            <YoutubeIcon className="h-5 w-5" /> Subscribe to {BRAND.youtubeHandle}
          </a>
        </div>
      </section>

      <div className="container-page py-14 sm:py-20">
        {!lead ? (
          <EmptyState
            title="Videos are on their way"
            body="Our latest cooking videos will appear here soon. In the meantime, watch everything on our YouTube channel."
            action={
              <a href={BRAND.youtube} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <YoutubeIcon className="h-4 w-4" /> Visit {BRAND.youtubeHandle}
              </a>
            }
          />
        ) : (
          <>
            <JsonLd
              data={{
                "@context": "https://schema.org",
                "@type": "ItemList",
                itemListElement: videos.map((v, i) => ({ "@type": "ListItem", position: i + 1, url: youtubeWatchUrl(v.youtubeId), name: v.title, image: youtubeThumb(v.youtubeId) })),
              }}
            />
            <section className="grid gap-8 lg:grid-cols-12 lg:items-center" aria-label="Featured video">
              <div className="lg:col-span-8">
                <VideoPlayer id={lead.youtubeId} title={lead.title} priority />
              </div>
              <div className="lg:col-span-4">
                <p className="eyebrow mb-3">{lead.featured ? "Featured" : "Latest"}</p>
                <h2 className="text-3xl text-ink">{lead.title}</h2>
                {lead.publishedAt && <p className="mt-2 text-sm text-muted">{formatDate(lead.publishedAt)}</p>}
                {lead.description && <p className="mt-4 line-clamp-6 leading-relaxed text-cocoa">{lead.description}</p>}
                <div className="mt-6 flex flex-wrap gap-3">
                  {lead.recipe?.published && (
                    <Link href={`/recipes/${lead.recipe.slug}`} className="btn-primary">Read the recipe</Link>
                  )}
                  <a href={youtubeWatchUrl(lead.youtubeId)} target="_blank" rel="noopener noreferrer" className="btn-outline">
                    Watch on YouTube <ArrowUpRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </section>

            {rest.length > 0 && (
              <section className="mt-20" aria-labelledby="library-heading">
                <h2 id="library-heading" className="mb-8 text-3xl text-ink">Video library</h2>
                <ul className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((v) => (
                    <li key={v.id}>
                      <VideoPlayer id={v.youtubeId} title={v.title} />
                      <h3 className="mt-4 text-xl text-ink">{v.title}</h3>
                      {v.description && <p className="mt-1.5 line-clamp-2 text-sm text-muted">{v.description}</p>}
                      <div className="mt-3 flex gap-4 text-sm font-medium">
                        {v.recipe?.published && (
                          <Link href={`/recipes/${v.recipe.slug}`} className="text-spice-deep hover:underline">Recipe</Link>
                        )}
                        <a href={youtubeWatchUrl(v.youtubeId)} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-ink">
                          YouTube ↗
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <section className="mt-20 flex flex-col items-center rounded-[2rem] bg-cream p-10 text-center sm:p-14">
          <YoutubeIcon className="h-10 w-10 text-[#CC0000]" />
          <h2 className="mt-4 text-3xl text-ink sm:text-4xl">Never miss a new recipe</h2>
          <p className="mt-3 max-w-lg text-muted">Subscribe on YouTube and tap the bell to be notified whenever a new video is out of our kitchen.</p>
          <a href={`${BRAND.youtube}?sub_confirmation=1`} target="_blank" rel="noopener noreferrer" className="btn-primary mt-7">
            Subscribe on YouTube
          </a>
        </section>
      </div>
    </>
  );
}
