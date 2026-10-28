import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { CONTENT_KINDS } from "@/lib/content-kinds";

// Where an image is used, so deleting it doesn't leave a broken picture on the site
export async function GET(req: Request) {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const url = new URL(req.url).searchParams.get("url") ?? "";
    if (!url.startsWith("/uploads/")) return NextResponse.json({ usedIn: [] });

    const [posts, sections, content, destinations, albums, photos, settings, pages] = await Promise.all([
      prisma.blogPost.findMany({
        where: {
          deletedAt: null,
          OR: [{ coverImage: url }, { ogImage: url }, { body: { contains: url } }],
        },
        select: { title: true },
      }),
      prisma.blogSection.findMany({
        where: { blog: { deletedAt: null } },
        select: { content: true, blog: { select: { title: true } } },
      }),
      prisma.contentItem.findMany({ select: { kind: true, data: true } }),
      prisma.destination.findMany({ where: { heroImage: url }, select: { name: true } }),
      prisma.gallery.findMany({ where: { coverImage: url }, select: { heading: true } }),
      prisma.galleryPhoto.findMany({ where: { src: url }, select: { gallery: { select: { heading: true } } } }),
      prisma.globalSettings.findFirst({ where: { defaultOgImage: url }, select: { id: true } }),
      prisma.page.findMany({ where: { ogImage: url }, select: { title: true } }),
    ]);

    const usedIn = new Set<string>();
    posts.forEach((p) => usedIn.add(`Post "${p.title}"`));
    sections
      .filter((s) => JSON.stringify(s.content).includes(url))
      .forEach((s) => usedIn.add(`Post "${s.blog.title}"`));
    content
      .filter((c) => JSON.stringify(c.data).includes(url))
      .forEach((c) => usedIn.add(CONTENT_KINDS[c.kind]?.title ?? c.kind));
    destinations.forEach((d) => usedIn.add(`Destination "${d.name}"`));
    albums.forEach((a) => usedIn.add(`Album cover "${a.heading}"`));
    photos.forEach((p) => usedIn.add(`Album "${p.gallery.heading}"`));
    if (settings) usedIn.add("Global SEO image");
    pages.forEach((p) => usedIn.add(`${p.title} page share image`));

    return NextResponse.json({ usedIn: [...usedIn] });
  } catch (error) {
    console.error("[MEDIA_USAGE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
