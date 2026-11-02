import { notFound } from "next/navigation";
import { getPage } from "@/lib/pages";
import { Markdown } from "@/lib/markdown";
import { pageMetadata } from "@/lib/seo";
import { ReviewNotice } from "@/components/ui/ReviewNotice";
import { JsonLd } from "@/components/ui/JsonLd";

export const revalidate = 3600;
export const metadata = pageMetadata({
  title: "Frequently Asked Questions",
  description: "Answers to common questions about Zauq e Zaika recipes, orders, delivery and more.",
  path: "/faq",
});

/** Extracts "### Question" + following paragraph pairs for FAQPage structured data. */
function faqPairs(body: string) {
  const pairs: { q: string; a: string }[] = [];
  const re = /^###\s+(.+)\n+([^#][\s\S]*?)(?=\n#{2,3}\s|$)/gm;
  let m;
  while ((m = re.exec(body))) {
    const a = m[2].trim().replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
    if (!/\[[A-Z ,.]+\]/.test(a)) pairs.push({ q: m[1].trim(), a }); // skip unanswered placeholders
  }
  return pairs;
}

export default async function FaqPage() {
  const page = await getPage("faq");
  if (!page) notFound();
  const pairs = faqPairs(page.body);
  return (
    <div className="container-page max-w-3xl py-12 sm:py-16">
      {pairs.length > 0 && (
        <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: pairs.map((p) => ({ "@type": "Question", name: p.q, acceptedAnswer: { "@type": "Answer", text: p.a } })) }} />
      )}
      <p className="eyebrow mb-3 text-center">Help centre</p>
      <h1 className="mb-10 text-center text-4xl text-ink sm:text-5xl">{page.title}</h1>
      {page.needsReview && <ReviewNotice />}
      <div className="prose-zz"><Markdown source={page.body} /></div>
    </div>
  );
}
