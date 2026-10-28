import { unstable_cache } from "next/cache";
import prisma from "./prisma";
import type { ContentData } from "./content-kinds";

export const CONTENT_TAG = "content";

const loadContent = unstable_cache(
  (kind: string) =>
    prisma.contentItem.findMany({
      where: { kind },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, data: true, isHidden: true },
    }),
  ["content-items"],
  { tags: [CONTENT_TAG] }
);

export interface ContentList<T> {
  // Visible items, in the admin's order
  items: (T & { id: string })[];
  // Including hidden ones: tells "never set up" apart from "all hidden"
  total: number;
}

// Public sections use this; a database hiccup leaves the section out instead of breaking the page
export async function getContent<T = ContentData>(kind: string): Promise<ContentList<T>> {
  try {
    const rows = await loadContent(kind);
    return {
      items: rows
        .filter((row) => !row.isHidden)
        .map((row) => ({ ...(row.data as T), id: row.id })),
      total: rows.length,
    };
  } catch (error) {
    console.error("[CONTENT]", kind, error);
    return { items: [], total: 0 };
  }
}
