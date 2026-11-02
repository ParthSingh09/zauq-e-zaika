import Link from "next/link";
import type { Settings } from "@/lib/settings";

export function AnnouncementBar({ announcement }: { announcement: Settings["announcement"] }) {
  if (!announcement.enabled || !announcement.text) return null;
  const external = announcement.linkHref.startsWith("http");
  return (
    <div className="bg-ink text-ivory">
      <p className="container-page flex min-h-10 flex-wrap items-center justify-center gap-x-3 py-2 text-center text-[13px] tracking-wide">
        <span>{announcement.text}</span>
        {announcement.linkLabel && announcement.linkHref && (
          external ? (
            <a href={announcement.linkHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-gold underline underline-offset-4">
              {announcement.linkLabel}
            </a>
          ) : (
            <Link href={announcement.linkHref} className="font-semibold text-gold underline underline-offset-4">
              {announcement.linkLabel}
            </Link>
          )
        )}
      </p>
    </div>
  );
}
