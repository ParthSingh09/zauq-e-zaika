"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { YoutubeIcon } from "@/components/ui/SocialIcons";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { MAIN_NAV, BRAND } from "@/lib/site";
import { useCart } from "@/components/shop/CartProvider";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const { count, ready } = useCart();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a,button")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        menuButton.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled ? "border-line bg-ivory/90 shadow-[0_6px_24px_-16px_rgb(57_39_30/0.35)] backdrop-blur-md" : "border-transparent bg-ivory",
      )}
    >
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-lg focus:bg-ink focus:px-4 focus:py-2 focus:text-ivory">
        Skip to content
      </a>
      <div className="container-page flex h-[72px] items-center justify-between gap-6">
        <Logo />

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {MAIN_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-[15px] font-medium transition-colors",
                    isActive(item.href) ? "text-ink" : "text-muted hover:text-ink",
                  )}
                >
                  {item.label}
                  <span
                    className={cn(
                      "absolute inset-x-4 -bottom-0.5 h-px origin-left bg-gold transition-transform duration-300",
                      isActive(item.href) ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1">
          <Link href="/recipes#search" className="rounded-full p-2.5 text-ink transition hover:bg-sand" aria-label="Search recipes">
            <Search className="h-5 w-5" />
          </Link>
          <ThemeToggle />
          <Link href="/account" className="hidden rounded-full p-2.5 text-ink transition hover:bg-sand sm:inline-flex" aria-label="My account">
            <User className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="relative rounded-full p-2.5 text-ink transition hover:bg-sand" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
            <ShoppingBag className="h-5 w-5" />
            {ready && count > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-spice-solid px-1 text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <button
            ref={menuButton}
            type="button"
            className="rounded-full p-2.5 text-ink transition hover:bg-sand lg:hidden"
            aria-label="Open menu"
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", open ? "visible" : "invisible")}
        aria-hidden={!open}
      >
        <div
          className={cn("absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-300", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <div
          id="mobile-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            "absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col bg-ivory shadow-2xl transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-[72px] items-center justify-between border-b border-line px-5">
            <span className="font-serif text-xl">Menu</span>
            <button type="button" className="rounded-full p-2.5 hover:bg-sand" aria-label="Close menu" onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-6">
            <ul className="space-y-1">
              {[{ href: "/", label: "Home" }, ...MAIN_NAV, { href: "/account", label: "My Account" }, { href: "/cart", label: "Cart" }].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    tabIndex={open ? 0 : -1}
                    className={cn(
                      "block rounded-xl px-4 py-3 font-serif text-2xl transition",
                      (item.href === "/" ? pathname === "/" : isActive(item.href)) ? "bg-sand text-ink" : "text-cocoa hover:bg-cream",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line p-5">
            <a href={BRAND.youtube} target="_blank" rel="noopener noreferrer" tabIndex={open ? 0 : -1} className="btn-accent w-full">
              <YoutubeIcon className="h-4 w-4" /> Watch on YouTube
            </a>
            <p className="mt-4 text-center font-serif text-sm text-muted italic">{BRAND.tagline}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
