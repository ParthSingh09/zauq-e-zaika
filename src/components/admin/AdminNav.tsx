"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, BookOpen, Tags, Package, ShoppingCart, Users, Inbox, Video, Star, Quote, Mail, Palette, FileText, Truck, Shield, Menu, X, ExternalLink,
} from "lucide-react";
import { LogoMark } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

const GROUPS = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Kitchen", items: [
    { href: "/admin/recipes", label: "Recipes", icon: BookOpen },
    { href: "/admin/categories", label: "Categories", icon: Tags },
    { href: "/admin/videos", label: "Videos", icon: Video },
    { href: "/admin/reviews", label: "Reviews", icon: Star },
  ] },
  { label: "Shop", items: [
    { href: "/admin/products", label: "Products", icon: Package },
    { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
    { href: "/admin/shop", label: "Shop & delivery", icon: Truck },
  ] },
  { label: "People", items: [
    { href: "/admin/customers", label: "Customers", icon: Users },
    { href: "/admin/enquiries", label: "Enquiries", icon: Inbox },
    { href: "/admin/newsletter", label: "Newsletter", icon: Mail },
    { href: "/admin/testimonials", label: "Testimonials", icon: Quote },
  ] },
  { label: "Website", items: [
    { href: "/admin/content", label: "Homepage & content", icon: Palette },
    { href: "/admin/pages", label: "Pages & policies", icon: FileText },
    { href: "/admin/security", label: "Admins & security", icon: Shield },
  ] },
];

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Admin" className="space-y-6 px-3 py-5">
      {GROUPS.map((g) => (
        <div key={g.label}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-[0.16em] text-paper/45 uppercase">{g.label}</p>
          <ul className="space-y-0.5">
            {g.items.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link href={href} aria-current={active(href) ? "page" : undefined}
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition", active(href) ? "bg-ivory/10 font-semibold text-paper" : "text-paper/70 hover:bg-ivory/5 hover:text-paper")}>
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="flex-1">{label}</span>
                  {badges[href] ? <span className="rounded-full bg-gold px-1.5 text-[11px] font-bold text-night">{badges[href]}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <Link href="/" target="_blank" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-paper/70 hover:text-paper">
        <ExternalLink className="h-4 w-4" /> View website
      </Link>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between bg-night px-4 text-paper lg:hidden">
        <Link href="/admin" className="flex items-center gap-2 font-serif text-lg"><LogoMark className="h-7 w-7" /> Admin</Link>
        <ThemeToggle className="ml-auto mr-1 rounded-lg p-2 text-paper hover:bg-white/10" />
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Close menu" : "Open menu"} className="rounded-lg p-2 hover:bg-white/10">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
      {open && <div className="fixed inset-0 top-14 z-30 overflow-y-auto bg-night lg:hidden">{nav}</div>}
      <aside className="fixed inset-y-0 left-0 hidden w-64 overflow-y-auto bg-night lg:block">
        <Link href="/admin" className="flex items-center gap-2.5 border-b border-white/10 px-6 py-5 font-serif text-xl text-paper">
          <LogoMark className="h-8 w-8" /> Zauq e Zaika
        </Link>
        {nav}
      </aside>
    </>
  );
}
