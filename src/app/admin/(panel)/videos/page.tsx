import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { youtubeThumb, youtubeWatchUrl } from "@/lib/youtube";
import { AdminHeader, Badge, Panel } from "@/components/admin/AdminUI";
import { VideoForm } from "@/components/admin/AdminForms";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { deleteVideo, importLatestVideos } from "@/server/actions/admin/content";

export const metadata = { title: "Videos" };

export default async function AdminVideos() {
  const [videos, recipes] = await Promise.all([
    prisma.video.findMany({ orderBy: [{ featured: "desc" }, { sortOrder: "asc" }, { publishedAt: "desc" }], include: { recipe: { select: { title: true } } } }),
    prisma.recipe.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);
  const apiReady = Boolean(process.env.YOUTUBE_API_KEY && process.env.YOUTUBE_CHANNEL_ID);
  return (
    <>
      <AdminHeader title="Videos" description="Add your YouTube cooking videos to the website’s video library." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Panel title="Add a video" className="lg:col-span-2">
          <VideoForm recipes={recipes} />
          <div className="mt-6 border-t border-line pt-5 text-sm">
            <p className="font-semibold text-ink">Automatic import (optional)</p>
            {apiReady ? (
              <div className="mt-2"><ConfirmButton action={importLatestVideos} className="btn-outline">Import latest uploads from YouTube</ConfirmButton></div>
            ) : (
              <p className="mt-1 text-muted">Set YOUTUBE_API_KEY and YOUTUBE_CHANNEL_ID to import your latest uploads automatically. Until then, add videos manually above.</p>
            )}
          </div>
        </Panel>
        <div className="space-y-3 lg:col-span-3">
          {videos.length === 0 && <Panel><p className="py-8 text-center text-muted">No videos yet. Paste a YouTube link to add your first video.</p></Panel>}
          {videos.map((v) => (
            <div key={v.id} className="flex gap-4 rounded-2xl border border-line bg-card p-3">
              <a href={youtubeWatchUrl(v.youtubeId)} target="_blank" rel="noopener noreferrer" className="relative aspect-video w-36 shrink-0 overflow-hidden rounded-lg bg-ink">
                <Image src={youtubeThumb(v.youtubeId)} alt="" fill sizes="144px" className="object-cover" />
              </a>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{v.title}</p>
                <p className="text-xs text-muted">{v.publishedAt ? formatDate(v.publishedAt) : "No date"}{v.recipe && ` · Recipe: ${v.recipe.title}`}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">{v.published ? <Badge tone="green">Visible</Badge> : <Badge>Hidden</Badge>}{v.featured && <Badge tone="gold">Featured</Badge>}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Link href={`/admin/videos/${v.id}`} className="btn-ghost btn-sm">Edit</Link>
                <ConfirmButton action={deleteVideo.bind(null, v.id)} confirm={`Remove “${v.title}” from the website? (It stays on YouTube.)`}>Remove</ConfirmButton>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
