/**
 * One-off content update for the Zauq-e-Zaika rebrand (Lucknow cloud kitchen, Instagram).
 *
 * Safe to run more than once. It only rewrites rows that still contain the OLD template wording
 * (old brand name, YouTube or the old tagline), so anything you have already edited in the admin
 * dashboard is left alone.
 *
 * Run: npm run db:rebrand
 */
import { PrismaClient } from "@prisma/client";
import { PAGES } from "./seed-pages";

const prisma = new PrismaClient();
const OLD = /Zauq e Zaika|YouTube|youtube|Dil Se|Har Zaika|cooking videos/;

async function main() {
  let pages = 0;
  for (const page of PAGES) {
    const row = await prisma.page.findUnique({ where: { slug: page.slug } });
    if (row && OLD.test(row.title + row.body)) {
      await prisma.page.update({ where: { slug: page.slug }, data: { title: page.title, body: page.body } });
      pages++;
    }
  }

  let recipes = 0;
  for (const r of await prisma.recipe.findMany({ where: { isSample: true } })) {
    if (r.intro.includes("Zauq e Zaika")) {
      await prisma.recipe.update({ where: { id: r.id }, data: { intro: r.intro.replaceAll("Zauq e Zaika", "Zauq-e-Zaika") } });
      recipes++;
    }
  }

  // Drop the old YouTube link and keep Instagram pointing at the real profile.
  let settings = 0;
  const social = await prisma.siteSetting.findUnique({ where: { key: "social" } });
  if (social && social.value && typeof social.value === "object") {
    const rest = { ...(social.value as Record<string, unknown>) };
    delete rest.youtube;
    const next = { ...rest, instagram: rest.instagram || "https://www.instagram.com/zauq.e.zaika?mdxt=MXI3eG5pNHFpMmw5NA==" };
    await prisma.siteSetting.update({ where: { key: "social" }, data: { value: next as object } });
    settings++;
  }
  // Old default copy that was saved to the database (only if still unchanged).
  for (const key of ["announcement", "hero", "home"]) {
    const row = await prisma.siteSetting.findUnique({ where: { key } });
    if (row && OLD.test(JSON.stringify(row.value))) {
      await prisma.siteSetting.delete({ where: { key } }); // falls back to the new defaults
      settings++;
    }
  }
  // Instagram correction: the profile is @zauq.e.zaika. Replace the earlier wrong link/handle wherever it was stored,
  // as a plain text swap so any other edits you made to these pages are kept.
  const WRONG_URL = /https:\/\/www\.instagram\.com\/zauqezaika\/?/g;
  const NEW_URL = "https://www.instagram.com/zauq.e.zaika?mdxt=MXI3eG5pNHFpMmw5NA==";
  let igFixed = 0;
  for (const row of await prisma.page.findMany()) {
    const body = row.body.replace(WRONG_URL, NEW_URL).replaceAll("@ZauqeZaika", "@zauq.e.zaika");
    if (body !== row.body) { await prisma.page.update({ where: { slug: row.slug }, data: { body } }); igFixed++; }
  }
  for (const row of await prisma.siteSetting.findMany()) {
    const text = JSON.stringify(row.value);
    const fixed = text.replace(WRONG_URL, NEW_URL).replaceAll("@ZauqeZaika", "@zauq.e.zaika");
    if (fixed !== text) { await prisma.siteSetting.update({ where: { key: row.key }, data: { value: JSON.parse(fixed) } }); igFixed++; }
  }
  console.log(`✓ Instagram link corrected in ${igFixed} stored item(s)`);
  console.log(`✓ Rebrand: ${pages} page(s), ${recipes} sample recipe(s), ${settings} setting(s) updated`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
