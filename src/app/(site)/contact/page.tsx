import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { getSettings, whatsappLink } from "@/lib/settings";
import { pageMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/site";
import { ContactForm } from "@/components/layout/ContactForm";
import { SocialLinks } from "@/components/layout/Footer";
import { WhatsappIcon, YoutubeIcon } from "@/components/ui/SocialIcons";

export const revalidate = 3600;
export const metadata = pageMetadata({
  title: "Contact Us",
  description: "Get in touch with Zauq e Zaika — questions about recipes, orders, collaborations or just to say hello.",
  path: "/contact",
});

export default async function ContactPage() {
  const { contact, social } = await getSettings();
  const wa = whatsappLink(contact.whatsappNumber, contact.whatsappMessage);
  const rows = [
    contact.email && { icon: Mail, label: "Email", value: contact.email, href: `mailto:${contact.email}` },
    contact.phone && { icon: Phone, label: "Phone", value: contact.phone, href: `tel:${contact.phone.replace(/\s/g, "")}` },
    contact.address && { icon: MapPin, label: "Address", value: contact.address },
    contact.hours && { icon: Clock, label: "Hours", value: contact.hours },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; href?: string }[];

  return (
    <>
      <section className="border-b border-line bg-cream/60">
        <div className="container-page py-14 text-center sm:py-20">
          <p className="eyebrow mb-3">We’d love to hear from you</p>
          <h1 className="text-4xl text-ink sm:text-5xl lg:text-6xl">Get in Touch</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted">
            A question about a recipe, an order enquiry, a collaboration idea — or simply a hello. Every message is read with care.
          </p>
        </div>
      </section>
      <div className="container-page grid gap-12 py-14 sm:py-20 lg:grid-cols-12">
        <div className="card p-6 sm:p-10 lg:col-span-7">
          <h2 className="mb-6 text-3xl text-ink">Send us a message</h2>
          <ContactForm />
        </div>
        <aside className="space-y-6 lg:col-span-5">
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-[var(--radius-card)] bg-[#1F7A4D] p-6 text-white transition hover:bg-[#186540]">
              <WhatsappIcon className="h-9 w-9" />
              <span><span className="block text-lg font-semibold">Chat on WhatsApp</span><span className="text-sm text-white/80">Quick questions & order enquiries</span></span>
            </a>
          )}
          {rows.length > 0 && (
            <ul className="space-y-4 rounded-[var(--radius-card)] border border-line bg-card p-6">
              {rows.map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold-deep"><Icon className="h-5 w-5" aria-hidden /></span>
                  <span>
                    <span className="block text-xs font-semibold tracking-[0.16em] text-muted uppercase">{label}</span>
                    {href ? <a href={href} className="text-ink hover:text-spice-deep">{value}</a> : <span className="whitespace-pre-line text-ink">{value}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <div className="rounded-[var(--radius-card)] bg-night p-6 text-paper">
            <h2 className="text-2xl">Follow our kitchen</h2>
            <p className="mt-2 text-sm text-paper/70">New recipes and behind-the-scenes moments.</p>
            <a href={BRAND.youtube} target="_blank" rel="noopener noreferrer" className="mt-5 flex items-center gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10 hover:bg-white/10">
              <YoutubeIcon className="h-6 w-6 text-[#FF4E45]" />
              <span className="text-sm"><span className="font-semibold">YouTube</span> · {BRAND.youtubeHandle}</span>
            </a>
            <SocialLinks social={social} className="mt-5 flex flex-wrap gap-2" />
          </div>
        </aside>
      </div>
    </>
  );
}
