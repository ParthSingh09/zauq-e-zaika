import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { JsonLd } from "@/components/ui/JsonLd";
import { getSettings } from "@/lib/settings";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const s = settings.social;
  return (
    <>
      <JsonLd data={organizationJsonLd([s.youtube, s.instagram, s.facebook, s.pinterest, s.x])} />
      <JsonLd data={websiteJsonLd()} />
      <AnnouncementBar announcement={settings.announcement} />
      <Header />
      <main id="main">{children}</main>
      <Footer settings={settings} />
    </>
  );
}
