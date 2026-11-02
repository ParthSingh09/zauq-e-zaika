import type { NextConfig } from "next";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "i.ytimg.com" },
];

// Allow images served from Supabase Storage when configured.
if (process.env.SUPABASE_URL) {
  try {
    const host = new URL(process.env.SUPABASE_URL).hostname;
    remotePatterns.push({ protocol: "https", hostname: host, pathname: "/storage/v1/object/public/**" });
  } catch {}
}

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://checkout.razorpay.com\")" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Resolve metadata before streaming for every user agent so missing pages return a real 404 status.
  htmlLimitedBots: /.*/,
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      { source: "/admin/(.*)", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
