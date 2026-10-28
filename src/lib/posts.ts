import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import type { BlogPost, BlogSection, Prisma } from "@prisma/client";
import prisma from "./prisma";
import { SITE_URL } from "./site";
import { slugify } from "./slug";

export { slugify };

export const POSTS_TAG = "posts";

// Scheduled posts go live by themselves once their date passes; refreshing the cached lists
// every minute makes that happen without anyone saving in the admin panel
const REFRESH_SECONDS = 60;

export function liveWhere(now = new Date()): Prisma.BlogPostWhereInput {
  return {
    deletedAt: null,
    OR: [{ status: "Published" }, { status: "Scheduled", publishDate: { lte: now } }],
  };
}

// Mirrors liveWhere for a post already in hand (MySQL compares the status case-insensitively)
export function isLive(
  post: Pick<BlogPost, "status" | "publishDate"> & { deletedAt?: Date | null },
  now = new Date()
) {
  if (post.deletedAt) return false;
  const status = post.status.toLowerCase();
  if (status === "published") return true;
  return status === "scheduled" && post.publishDate !== null && post.publishDate <= now;
}

export function postPath(slug: string) {
  return slug.startsWith("/") ? slug.substring(1) : slug;
}

// Older posts were saved with a leading slash ("/my-post"), newer ones without
export function slugVariants(slug: string) {
  const bare = postPath(slug);
  return [bare, `/${bare}`];
}

// The data cache stores JSON, so dates come back as strings after the first request
function withDates<T extends { createdAt: Date; updatedAt?: Date; publishDate: Date | null }>(post: T): T {
  return {
    ...post,
    createdAt: new Date(post.createdAt),
    ...(post.updatedAt !== undefined && { updatedAt: new Date(post.updatedAt) }),
    publishDate: post.publishDate ? new Date(post.publishDate) : null,
  };
}

export const getEventLinks = unstable_cache(
  () =>
    prisma.blogPost.findMany({
      where: liveWhere(),
      select: { title: true, slug: true },
      orderBy: { createdAt: "desc" },
    }),
  ["event-links"],
  { tags: [POSTS_TAG], revalidate: REFRESH_SECONDS }
);

const loadLivePosts = unstable_cache(
  () =>
    prisma.blogPost.findMany({
      where: liveWhere(),
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        coverAlt: true,
        publishDate: true,
        createdAt: true,
        destinationId: true,
        sections: {
          where: { section: "hero" },
          select: { content: true },
          take: 1,
        },
        categories: { select: { category: { select: { name: true, slug: true } } } },
      },
    }),
  ["live-posts"],
  { tags: [POSTS_TAG], revalidate: REFRESH_SECONDS }
);

export async function getLivePosts() {
  return (await loadLivePosts()).map(withDates);
}

export type PostWithSections = BlogPost & {
  sections: BlogSection[];
  categories: { category: { name: string; slug: string } }[];
  tags: { tag: { name: string; slug: string } }[];
};

// Includes drafts so admins can preview them; the page decides who may see a post
const loadPostBySlug = unstable_cache(
  (slug: string) =>
    prisma.blogPost.findFirst({
      where: { slug: { in: slugVariants(slug) }, deletedAt: null },
      include: {
        sections: true,
        categories: { include: { category: { select: { name: true, slug: true } } } },
        tags: { include: { tag: { select: { name: true, slug: true } } } },
      },
    }),
  ["post-by-slug"],
  { tags: [POSTS_TAG], revalidate: REFRESH_SECONDS }
);

export async function getPostBySlug(slug: string): Promise<PostWithSections | null> {
  const post = await loadPostBySlug(slug);
  return post ? withDates({ ...post, deletedAt: post.deletedAt ? new Date(post.deletedAt) : null }) : null;
}

// Other live posts for "More celebrations": same destination first, then the newest
export async function getRelatedPosts(post: Pick<BlogPost, "id" | "destinationId">, count = 3) {
  const others = (await getLivePosts()).filter((other) => other.id !== post.id);
  const sameDestination = post.destinationId
    ? others.filter((other) => other.destinationId === post.destinationId)
    : [];
  const rest = others.filter((other) => !sameDestination.includes(other));
  return [...sameDestination, ...rest].slice(0, count);
}

export function sectionContent<T>(post: PostWithSections, name: string): Partial<T> {
  return (post.sections.find((s) => s.section === name)?.content ?? {}) as Partial<T>;
}

// Each post is served at both /events/<slug> and /blog/<slug>; the events URL is the one
// search engines should index unless the post sets its own canonical URL
export function canonicalPostUrl(post: Pick<BlogPost, "slug" | "canonicalUrl">) {
  return post.canonicalUrl || `${SITE_URL}/events/${postPath(post.slug)}`;
}

export function postMetadata(post: PostWithSections | null): Metadata {
  if (!post) return {};

  return {
    title: post.metaTitle || post.title,
    description: post.metaDescription || post.excerpt,
    keywords: post.metaKeywords || "",
    alternates: {
      canonical: canonicalPostUrl(post),
    },
    openGraph: {
      title: post.ogTitle || post.metaTitle || post.title,
      description: post.ogDescription || post.metaDescription || post.excerpt || undefined,
      images: post.ogImage || post.coverImage ? [post.ogImage || post.coverImage!] : [],
    },
    // Drafts open for admins (preview) but must never be indexed
    robots: isLive(post) ? post.robots : "noindex, nofollow",
  };
}

// The address must be free; a post in the trash still holds its address
export async function slugTakenMessage(slug: string, exceptId?: string) {
  const taken = await prisma.blogPost.findFirst({
    where: { slug: { in: slugVariants(slug) }, ...(exceptId && { NOT: { id: exceptId } }) },
    select: { deletedAt: true },
  });
  if (!taken) return null;
  return taken.deletedAt
    ? `A post in the trash uses the address "${slug}". Restore it or delete it for good first.`
    : `Another post already uses the address "${slug}". Please choose a different one.`;
}

// Words across the story and the template sections, at 220 words a minute
export function readingTime(post: PostWithSections) {
  const text = [
    post.excerpt ?? "",
    post.body ?? "",
    ...post.sections.flatMap((s) =>
      Object.values((s.content ?? {}) as Record<string, unknown>).filter(
        (value): value is string => typeof value === "string"
      )
    ),
  ]
    .join(" ")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+|\/[\w./-]+\.(jpe?g|png|webp|avif)/gi, " ");
  const words = text.split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
}

// The live posts either side of this one, by date: older and newer
export async function getAdjacentPosts(postId: string) {
  const posts = await getLivePosts();
  const index = posts.findIndex((p) => p.id === postId);
  if (index === -1) return { older: null, newer: null };
  return { older: posts[index + 1] ?? null, newer: posts[index - 1] ?? null };
}
