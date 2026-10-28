import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import galleries from "./galleries/image-gallery";
import { liveWhere, postPath } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

// Rebuilt hourly so new and scheduled posts show up without a deploy
export const revalidate = 3600;

const STATIC_PATHS = ["/about", "/offerings", "/galleries", "/events", "/blog", "/inquire"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now },
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, lastModified: now })),
    ...Object.keys(galleries).map((slug) => ({
      url: `${SITE_URL}/galleries/${slug}`,
      lastModified: now,
    })),
  ];

  try {
    const [posts, destinations] = await Promise.all([
      prisma.blogPost.findMany({
        where: liveWhere(now),
        select: { slug: true, updatedAt: true },
      }),
      prisma.destination.findMany({
        where: { isHidden: false },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    const destinationPages = destinations.length
      ? [
          { url: `${SITE_URL}/destinations`, lastModified: now },
          ...destinations.map((d) => ({
            url: `${SITE_URL}/destinations/${d.slug}`,
            lastModified: d.updatedAt,
          })),
        ]
      : [];

    // Only the /events address: /blog/<slug> shows the same post and points Google here
    const postPages = posts.map((post) => ({
      url: `${SITE_URL}/events/${postPath(post.slug)}`,
      lastModified: post.updatedAt,
    }));

    return [...staticPages, ...destinationPages, ...postPages];
  } catch (error) {
    // Fallback if the database fails to respond during compilation
    return staticPages;
  }
}
