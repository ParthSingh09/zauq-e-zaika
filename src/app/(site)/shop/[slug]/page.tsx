import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProductBySlug } from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import { absoluteUrl, pageMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/site";
import { siteUrl } from "@/lib/utils";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { DietMark } from "@/components/ui/DietMark";
import { JsonLd } from "@/components/ui/JsonLd";
import { SampleBadge } from "@/components/ui/SampleBadge";
import { AddToCart } from "@/components/shop/AddToCart";
import { WishlistButton } from "@/components/shop/WishlistButton";
import { productAvailability } from "@/components/shop/ProductCard";

export const revalidate = 120;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  return pageMetadata({
    title: p.name,
    description: p.shortDescription || p.description.slice(0, 155),
    path: `/shop/${p.slug}`,
    image: p.images[0] && !p.images[0].endsWith(".svg") ? p.images[0] : undefined,
    noIndex: p.isSample,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const [product, settings] = await Promise.all([getProductBySlug(slug), getSettings()]);
  if (!product || !settings.shop.enabled) notFound();

  const avail = productAvailability(product);
  const blockedReason = product.isSample
    ? "This is a demonstration product and is not available for purchase."
    : !avail.buyable
      ? `${avail.label}.`
      : !settings.shop.checkoutEnabled
        ? "Online ordering opens soon — check back shortly."
        : null;
  const images = product.images.length ? product.images : ["/images/placeholders/pickles-masalas.svg"];
  const details = [
    { label: "Weight / size", value: product.weight },
    { label: "Ingredients", value: product.ingredientsText },
    { label: "Allergens", value: product.allergens },
    { label: "Shelf life & storage", value: product.shelfLife },
  ].filter((d) => d.value);

  // Product schema only for real, purchasable listings with real prices.
  const prices = product.variants.length ? product.variants.map((v) => v.pricePaise) : [product.pricePaise];
  const jsonLd = !product.isSample && Math.min(...prices) > 0
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.shortDescription || product.description,
        image: images.filter((i) => !i.endsWith(".svg")).map(absoluteUrl),
        brand: { "@type": "Brand", name: BRAND.name },
        ...(product.category ? { category: product.category.name } : {}),
        offers: {
          "@type": product.variants.length > 1 ? "AggregateOffer" : "Offer",
          priceCurrency: "INR",
          ...(product.variants.length > 1
            ? { lowPrice: (Math.min(...prices) / 100).toFixed(2), highPrice: (Math.max(...prices) / 100).toFixed(2), offerCount: prices.length }
            : { price: (prices[0] / 100).toFixed(2) }),
          availability: avail.buyable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: siteUrl(`/shop/${product.slug}`),
        },
      }
    : null;

  return (
    <div className="container-page py-8 sm:py-12">
      {jsonLd && <JsonLd data={jsonLd} />}
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Shop", path: "/shop" },
          { name: product.name, path: `/shop/${product.slug}` },
        ]}
      />
      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-cream ring-1 ring-line/60">
            <Image src={images[0]} alt={product.name} fill priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            {product.isSample && <SampleBadge label="Demo product" className="absolute top-4 left-4" />}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1, 5).map((src, i) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-cream">
                  <Image src={src} alt={`${product.name} — photo ${i + 2}`} fill sizes="25vw" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:pt-4">
          <div className="flex items-center gap-3 text-sm text-muted">
            {product.category && <span className="eyebrow">{product.category.name}</span>}
            <DietMark diet={product.diet} withLabel />
          </div>
          <h1 className="mt-3 text-4xl text-ink sm:text-5xl">{product.name}</h1>
          {product.shortDescription && <p className="mt-4 text-lg text-muted">{product.shortDescription}</p>}
          <div className="mt-8">
            <AddToCart
              productId={product.id}
              basePricePaise={product.pricePaise}
              variants={product.variants.map((v) => ({ id: v.id, name: v.name, pricePaise: v.pricePaise, stock: v.stock }))}
              trackStock={product.trackStock}
              stock={product.stock}
              blockedReason={blockedReason}
              isSample={product.isSample}
            />
          </div>
          <div className="mt-5">
            <WishlistButton productId={product.id} slug={product.slug} />
          </div>

          {product.description && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="text-2xl text-ink">About this product</h2>
              <p className="mt-3 leading-relaxed whitespace-pre-line text-cocoa">{product.description}</p>
            </div>
          )}
          {details.length > 0 && (
            <dl className="mt-8 divide-y divide-line border-y border-line">
              {details.map((d) => (
                <div key={d.label} className="grid gap-1 py-4 sm:grid-cols-3">
                  <dt className="text-sm font-semibold text-ink">{d.label}</dt>
                  <dd className="text-sm text-cocoa sm:col-span-2">{d.value}</dd>
                </div>
              ))}
            </dl>
          )}
          {(settings.shop.preparationTime || settings.shop.orderCutoff) && (
            <p className="mt-6 text-sm text-muted">
              {settings.shop.preparationTime && <>Freshly prepared: {settings.shop.preparationTime}. </>}
              {settings.shop.orderCutoff && <>Order cut-off: {settings.shop.orderCutoff}.</>}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
