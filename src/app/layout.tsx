import type { Metadata, Viewport } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toaster";
import { CartProvider } from "@/components/shop/CartProvider";
import { BRAND } from "@/lib/site";
import { siteUrl } from "@/lib/utils";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["SOFT", "opsz"],
  style: ["normal", "italic"],
});
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl("/")),
  title: {
    default: `${BRAND.name} — Authentic Homemade Indian Recipes & Food`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  keywords: [
    "traditional Indian recipes",
    "homemade Indian food",
    "easy Indian recipes",
    "homemade sweets",
    "Indian cooking recipes",
    "Zauq e Zaika",
  ],
  openGraph: { siteName: BRAND.name, locale: "en_IN", type: "website" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFDF8" },
    { media: "(prefers-color-scheme: dark)", color: "#14100C" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Runs before first paint so the page never flashes the wrong theme.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("zz_theme");if(t!=="light"&&t!=="dark"){t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.dataset.theme=t}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={`${fraunces.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-screen overflow-x-hidden">
        <ToastProvider>
          <CartProvider>{children}</CartProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
