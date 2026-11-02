import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/account", "/cart", "/checkout", "/orders/", "/track-order"] }],
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(""),
  };
}
