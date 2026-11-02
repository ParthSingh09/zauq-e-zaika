import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "./JsonLd";
import { breadcrumbJsonLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="no-print">
      <JsonLd data={breadcrumbJsonLd(items)} />
      <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
        {items.map((item, i) => (
          <li key={item.path} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-beige" aria-hidden />}
            {i === items.length - 1 ? (
              <span aria-current="page" className="text-ink">{item.name}</span>
            ) : (
              <Link href={item.path} className="hover:text-ink">{item.name}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
