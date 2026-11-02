import { getSettings } from "@/lib/settings";
import { AdminHeader, Panel } from "@/components/admin/AdminUI";
import { AnnouncementForm, ContactSettingsForm, HeroForm, HomeForm, SocialForm } from "@/components/admin/AdminForms";

export const metadata = { title: "Homepage & content" };

export default async function Content() {
  const s = await getSettings();
  return (
    <>
      <AdminHeader title="Homepage & content" description="Edit the announcement bar, homepage banner and sections, contact details and social links." />
      <nav className="mb-6 flex flex-wrap gap-2 text-sm">
        {[["#announcement", "Announcement"], ["#hero", "Hero banner"], ["#home", "Homepage sections"], ["#contact", "Contact"], ["#social", "Social"]].map(([h, l]) => <a key={h} href={h} className="chip">{l}</a>)}
      </nav>
      <div className="space-y-6">
        <div id="announcement" className="scroll-mt-20"><Panel title="Announcement bar"><AnnouncementForm s={s.announcement} /></Panel></div>
        <div id="hero" className="scroll-mt-20"><Panel title="Hero banner"><HeroForm s={s.hero} /></Panel></div>
        <div id="home" className="scroll-mt-20"><Panel title="Homepage sections"><HomeForm s={s.home} /></Panel></div>
        <div id="contact" className="scroll-mt-20"><Panel title="Contact information" description="Shown on the contact page, footer and WhatsApp buttons."><ContactSettingsForm s={s.contact} /></Panel></div>
        <div id="social" className="scroll-mt-20"><Panel title="Social media links"><SocialForm s={s.social} /></Panel></div>
      </div>
    </>
  );
}
