import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { postPath, slugTakenMessage } from "@/lib/posts";

// A draft copy with every section, category and tag, at the first free "<slug>-copy" address
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const source = await prisma.blogPost.findUnique({
      where: { id },
      include: { sections: true, categories: true, tags: true },
    });
    if (!source) return new NextResponse("Not Found", { status: 404 });

    const base = `${postPath(source.slug)}-copy`;
    let slug = base;
    for (let n = 2; await slugTakenMessage(slug); n++) slug = `${base}-${n}`;

    const copy = await prisma.blogPost.create({
      data: {
        title: `${source.title} (copy)`,
        slug,
        status: "Draft",
        authorId: source.authorId,
        coverImage: source.coverImage,
        coverAlt: source.coverAlt,
        excerpt: source.excerpt,
        body: source.body,
        metaTitle: source.metaTitle,
        metaKeywords: source.metaKeywords,
        metaDescription: source.metaDescription,
        ogTitle: source.ogTitle,
        ogDescription: source.ogDescription,
        ogImage: source.ogImage,
        robots: source.robots,
        ...(source.destinationId && { destination: { connect: { id: source.destinationId } } }),
        sections: {
          create: source.sections.map((s) => ({
            section: s.section,
            content: s.content as Prisma.InputJsonValue,
            sortOrder: s.sortOrder,
          })),
        },
        categories: { create: source.categories.map((c) => ({ category: { connect: { id: c.categoryId } } })) },
        tags: { create: source.tags.map((t) => ({ tag: { connect: { id: t.tagId } } })) },
      },
    });

    await logActivity(session.user.id, `Duplicated post "${source.title}"`, "Blog", { postId: copy.id });
    return NextResponse.json(copy);
  } catch (error) {
    console.error("[BLOG_DUPLICATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
