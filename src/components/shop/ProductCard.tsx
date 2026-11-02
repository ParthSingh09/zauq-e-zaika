import Image from "next/image";
import Link from "next/link";
import type { ProductCardData } from "@/lib/queries";
import { formatPaise } from "@/lib/money";
import { DietMark } from "@/components/ui/DietMark";
import { SampleBadge } from "@/components/ui/SampleBadge";

const FALLBACK = "/images/placeholders/pickles-masalas.svg";

export function productAvailability(p: Pick<ProductCardData, "isSample" | "available" | "trackStock" | "stock" | "variants">) {
  if (p.isSample) return { buyable: false, label: "Demonstration only" };
  if (!p.available) return { buyable: false, label: "Currently unavailable" };
  if (p.trackStock) {
    const stock = p.variants.length ? p.variants.reduce((s, v) => s + v.stock, 0) : p.stock;
    if (stock <= 0) return { buyable: false, label: "Out of stock" };
  }
  return { buyable: true, label: "Available" };
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const prices = product.variants.length ? product.variants.map((v) => v.pricePaise) : [product.pricePaise];
  const min = Math.min(...prices);
  const avail = productAvailability(product);
  return (
    <article className="group relative flex h-full flex-col">
      <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] bg-cream ring-1 ring-line/60">
        <Image
          src={product.images[0] || FALLBACK}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {product.isSample && <SampleBadge label="Demo product" />}
          {!product.isSample && !avail.buyable && (
            <span className="rounded-full bg-ivory/90 px-3 py-1 text-[11px] font-semibold text-ink">{avail.label}</span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col pt-4">
        <div className="flex items-center justify-between gap-2 text-xs text-muted">
          <span>{product.category?.name ?? "Homemade"}</span>
          <DietMark diet={product.diet} />
        </div>
        <h3 className="mt-1.5 text-xl text-ink">
          <Link href={`/shop/${product.slug}`} className="after:absolute after:inset-0">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.shortDescription}</p>
        <p className="mt-auto pt-3 text-[15px] font-semibold text-ink">
          {product.isSample ? (
            <span className="font-normal text-muted">Price to be announced</span>
          ) : (
            <>
              {product.variants.length > 1 && <span className="font-normal text-muted">From </span>}
              {formatPaise(min)}
              {product.compareAtPaise && product.compareAtPaise > min && (
                <s className="ml-2 text-sm font-normal text-muted">{formatPaise(product.compareAtPaise)}</s>
              )}
            </>
          )}
        </p>
      </div>
    </article>
  );
}
