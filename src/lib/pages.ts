import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "./db";

export const getPage = (slug: string) =>
  unstable_cache(() => prisma.page.findUnique({ where: { slug } }), ["page", slug], { tags: [`page:${slug}`, "pages"], revalidate: 3600 })();
