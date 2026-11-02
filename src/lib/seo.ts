import type { Metadata } from "next";
import { BRAND } from "./site";
import { siteUrl } from "./utils";

/** Builds consistent page metadata with canonical URL + Open Graph + Twitter cards. */
export function pageMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noIndex = false,
}: {
  title?: string;
  description?: string;
  path: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
}): Metadata {
  const desc = description ?? BRAND.description;
  const images = image ? [{ url: image }] : undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: title ? `${title} · ${BRAND.name}` : BRAND.name,
      description: desc,
      url: path,
      siteName: BRAND.name,
      type,
      locale: "en_IN",
      ...(images ? { images } : {}),
    },
    twitter: { card: "summary_large_image", title: title ?? BRAND.name, description: desc, ...(images ? { images } : {}) },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

export const absoluteUrl = (pathOrUrl: string) => (pathOrUrl.startsWith("http") ? pathOrUrl : siteUrl(pathOrUrl));

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: siteUrl(item.path),
    })),
  };
}

export function organizationJsonLd(sameAs: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    slogan: BRAND.tagline,
    url: siteUrl("/"),
    logo: siteUrl("/brand/logo-mark.png"),
    sameAs: sameAs.filter(Boolean),
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: siteUrl("/"),
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${siteUrl("/recipes")}?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}
