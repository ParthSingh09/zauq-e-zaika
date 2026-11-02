"use client";

import Image from "next/image";
import { useState } from "react";
import { Play } from "lucide-react";
import { youtubeEmbedUrl, youtubeThumb } from "@/lib/youtube";
import { cn } from "@/lib/utils";

/**
 * Lightweight YouTube embed: shows the thumbnail and only loads the heavy
 * YouTube iframe after the visitor clicks play (great for Core Web Vitals).
 */
export function VideoPlayer({ id, title, className, priority }: { id: string; title: string; className?: string; priority?: boolean }) {
  const [active, setActive] = useState(false);
  return (
    <div className={cn("relative aspect-video overflow-hidden rounded-[var(--radius-card)] bg-ink", className)}>
      {active ? (
        <iframe
          src={youtubeEmbedUrl(id)}
          title={title}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setActive(true)} className="group absolute inset-0 h-full w-full" aria-label={`Play video: ${title}`}>
          <Image src={youtubeThumb(id)} alt="" fill priority={priority} sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover opacity-90 transition duration-500 group-hover:scale-[1.02] group-hover:opacity-100" />
          <span className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />
          <span className="absolute top-1/2 left-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ivory/95 text-ink shadow-xl transition duration-300 group-hover:scale-110 group-hover:bg-gold">
            <Play className="ml-1 h-6 w-6 fill-current" aria-hidden />
          </span>
        </button>
      )}
    </div>
  );
}
