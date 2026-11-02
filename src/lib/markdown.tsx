import { Fragment, type ReactNode } from "react";
import Link from "next/link";

/**
 * Tiny, safe markdown renderer for admin-edited pages.
 * Supports: # / ## / ### headings, paragraphs, "- " lists, "1. " lists, > quotes,
 * **bold**, *italic* and [links](url). No raw HTML is ever rendered.
 */
function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${i++}`;
    if (tok.startsWith("**")) out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("*")) out.push(<em key={key}>{tok.slice(1, -1)}</em>);
    else {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)!;
      const href = lm[2];
      const safe = /^(https?:|mailto:|tel:|\/)/.test(href) ? href : "#";
      out.push(
        safe.startsWith("/") ? (
          <Link key={key} href={safe}>
            {lm[1]}
          </Link>
        ) : (
          <a key={key} href={safe} rel="noopener noreferrer" target={safe.startsWith("http") ? "_blank" : undefined}>
            {lm[1]}
          </a>
        ),
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return (
    <>
      {blocks.map((block, bi) => {
        const b = block.trim();
        if (!b) return null;
        const k = `b${bi}`;
        const h = b.match(/^(#{1,3})\s+(.*)$/);
        if (h && !b.includes("\n")) {
          const level = h[1].length;
          const id = h[2].toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
          if (level === 1) return <h2 key={k} id={id}>{inline(h[2], k)}</h2>;
          if (level === 2) return <h2 key={k} id={id}>{inline(h[2], k)}</h2>;
          return <h3 key={k} id={id}>{inline(h[2], k)}</h3>;
        }
        const lines = b.split("\n");
        if (lines.every((l) => /^\s*[-*]\s+/.test(l)))
          return (
            <ul key={k}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*[-*]\s+/, ""), `${k}-${li}`)}</li>
              ))}
            </ul>
          );
        if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l)))
          return (
            <ol key={k}>
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(/^\s*\d+[.)]\s+/, ""), `${k}-${li}`)}</li>
              ))}
            </ol>
          );
        if (lines.every((l) => l.startsWith(">")))
          return <blockquote key={k}>{inline(lines.map((l) => l.replace(/^>\s?/, "")).join(" "), k)}</blockquote>;
        return (
          <p key={k}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${k}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
