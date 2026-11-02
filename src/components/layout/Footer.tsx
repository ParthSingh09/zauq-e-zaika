import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { BRAND, POLICY_PAGES } from "@/lib/site";
import type { Settings } from "@/lib/settings";
import { whatsappLink } from "@/lib/settings";
import { FacebookIcon, InstagramIcon, PinterestIcon, WhatsappIcon, XIcon, YoutubeIcon } from "@/components/ui/SocialIcons";

export function SocialLinks({ social, className }: { social: Settings["social"]; className?: string }) {
  const links = [
    { href: social.youtube, label: "YouTube", Icon: YoutubeIcon },
    { href: social.instagram, label: "Instagram", Icon: InstagramIcon },
    { href: social.facebook, label: "Facebook", Icon: FacebookIcon },
    { href: social.pinterest, label: "Pinterest", Icon: PinterestIcon },
    { href: social.x, label: "X (Twitter)", Icon: XIcon },
  ].filter((l) => l.href);
  return (
    <ul className={className ?? "flex gap-2"}>
      {links.map(({ href, label, Icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Zauq e Zaika on ${label}`}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-ivory/85 transition hover:border-gold hover:bg-gold hover:text-ink"
          >
            <Icon className="h-[18px] w-[18px]" />
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer({ settings }: { settings: Settings }) {
  const { contact, social, shop } = settings;
  const wa = whatsappLink(contact.whatsappNumber, contact.whatsappMessage);
  const columns = [
    {
      title: "Explore",
      links: [
        { href: "/recipes", label: "All Recipes" },
        { href: "/videos", label: "Cooking Videos" },
        ...(shop.enabled ? [{ href: "/shop", label: "Shop" }] : []),
        { href: "/about", label: "Our Story" },
        { href: "/faq", label: "FAQ" },
      ],
    },
    {
      title: "Help",
      links: [
        { href: "/contact", label: "Contact Us" },
        { href: "/track-order", label: "Track an Order" },
        { href: "/account", label: "My Account" },
        { href: "/policies/cookie-policy", label: "Cookie Preferences" },
      ],
    },
    { title: "Policies", links: POLICY_PAGES.filter((p) => p.slug !== "cookie-policy").map((p) => ({ href: `/policies/${p.slug}`, label: p.label })) },
  ];

  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-ivory">
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
      <div className="container-page relative grid gap-12 py-16 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <Logo tone="light" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ivory/70">{BRAND.description}</p>
          <SocialLinks social={social} className="mt-6 flex flex-wrap gap-2" />
          <div className="mt-6 space-y-2 text-sm text-ivory/75">
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-gold">
                <Mail className="h-4 w-4" aria-hidden /> {contact.email}
              </a>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 hover:text-gold">
                <Phone className="h-4 w-4" aria-hidden /> {contact.phone}
              </a>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-gold">
                <WhatsappIcon className="h-4 w-4" /> Chat on WhatsApp
              </a>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-5">
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="mb-4 font-sans text-xs font-semibold tracking-[0.2em] text-gold uppercase">{col.title}</h2>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-ivory/75 transition hover:text-ivory">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="lg:col-span-3">
          <h2 className="font-serif text-2xl">Recipes in your inbox</h2>
          <p className="mt-2 mb-5 text-sm text-ivory/70">New family recipes and kitchen stories. No spam, unsubscribe anytime.</p>
          <NewsletterForm tone="dark" />
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-ivory/55 sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="font-serif text-sm text-gold/90 italic">{BRAND.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
