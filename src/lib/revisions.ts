import type { Prisma } from "@prisma/client";
import prisma from "./prisma";

// Post fields a revision keeps (and restores); sections are stored alongside
const SNAPSHOT_FIELDS = [
  "title",
  "slug",
  "status",
  "publishDate",
  "excerpt",
  "coverImage",
  "coverAlt",
  "body",
  "metaTitle",
  "metaKeywords",
  "metaDescription",
  "canonicalUrl",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "structuredData",
  "robots",
  "destinationId",
] as const;

const KEEP_REVISIONS = 30;

export interface PostSnapshot {
  post: Record<string, unknown>;
  sections: { section: string; content: Prisma.JsonValue }[];
}

export async function takeSnapshot(postId: string): Promise<PostSnapshot | null> {
  const post = await prisma.blogPost.findUnique({ where: { id: postId }, include: { sections: true } });
  if (!post) return null;
  return {
    post: Object.fromEntries(SNAPSHOT_FIELDS.map((field) => [field, post[field]])),
    sections: post.sections.map((s) => ({ section: s.section, content: s.content })),
  };
}

// Saves the post as it is now; older versions beyond the last 30 are dropped
export async function saveRevision(postId: string, userId: string | undefined, label: string) {
  try {
    const snapshot = await takeSnapshot(postId);
    if (!snapshot) return;
    await prisma.postRevision.create({
      data: { postId, userId: userId ?? null, label, snapshot: snapshot as unknown as Prisma.InputJsonValue },
    });
    const old = await prisma.postRevision.findMany({
      where: { postId },
      orderBy: { createdAt: "desc" },
      skip: KEEP_REVISIONS,
      select: { id: true },
    });
    if (old.length) await prisma.postRevision.deleteMany({ where: { id: { in: old.map((r) => r.id) } } });
  } catch (error) {
    console.error("[REVISION]", error);
  }
}

// Which parts differ between two snapshots, in words an editor recognises
export function describeChanges(before: PostSnapshot | null, after: PostSnapshot): string[] {
  if (!before) return ["First saved version"];
  const labels: Record<string, string> = {
    title: "title",
    slug: "address",
    status: "status",
    publishDate: "date",
    excerpt: "excerpt",
    coverImage: "cover image",
    coverAlt: "cover description",
    body: "story",
    destinationId: "destination",
  };
  const changed = new Set<string>();
  for (const field of SNAPSHOT_FIELDS) {
    if (JSON.stringify(before.post[field]) !== JSON.stringify(after.post[field])) {
      changed.add(labels[field] ?? "SEO");
    }
  }
  const sectionsOf = (snap: PostSnapshot) =>
    Object.fromEntries(snap.sections.map((s) => [s.section, JSON.stringify(s.content)]));
  const a = sectionsOf(before);
  const b = sectionsOf(after);
  for (const name of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[name] !== b[name]) changed.add(`${name} section`);
  }
  return [...changed];
}

export { SNAPSHOT_FIELDS };
