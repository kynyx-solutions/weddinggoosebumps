import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { POSTS_TAG, postPath, slugify, slugTakenMessage } from "@/lib/posts";
import { saveRevision } from "@/lib/revisions";
import { refreshPublicPages } from "@/lib/site";

const STATUSES = ["Draft", "Scheduled", "Published"];

// Fields the editor may change; anything else in the request is ignored
const TEXT_FIELDS = [
  "title",
  "coverImage",
  "coverAlt",
  "excerpt",
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
] as const;

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const { id } = await params;
    const post = await prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) return new NextResponse("Not Found", { status: 404 });
    return NextResponse.json(post);
  } catch (error) {
    console.error("[BLOG_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const autosave = new URL(req.url).searchParams.get("autosave") === "1";
    const json = await req.json();

    const existing = await prisma.blogPost.findUnique({
      where: { id },
      select: { title: true, slug: true, status: true, publishDate: true },
    });
    if (!existing) return new NextResponse("Not Found", { status: 404 });

    const data: Prisma.BlogPostUpdateInput = {};
    for (const field of TEXT_FIELDS) {
      if (field in json) {
        (data as Record<string, unknown>)[field] = typeof json[field] === "string" ? json[field] : null;
      }
    }
    if ("title" in json && !String(json.title ?? "").trim()) {
      return badRequest("Please enter a title");
    }

    // Only a changed address is checked and tidied, so older "/my-post" slugs stay as they are
    if ("slug" in json && postPath(String(json.slug ?? "")) !== postPath(existing.slug)) {
      const slug = slugify(String(json.slug ?? ""));
      if (!slug) return badRequest("The address needs at least one letter or number");
      const taken = await slugTakenMessage(slug, id);
      if (taken) return badRequest(taken, 409);
      data.slug = slug;
    }

    if ("status" in json) {
      const status = STATUSES.find((s) => s.toLowerCase() === String(json.status).toLowerCase());
      if (!status) return badRequest("Unknown status");
      data.status = status;
    }

    if ("publishDate" in json) {
      if (!json.publishDate) {
        data.publishDate = null;
      } else {
        const date = new Date(json.publishDate);
        if (Number.isNaN(date.getTime())) return badRequest("Invalid publish date");
        data.publishDate = date;
      }
    }

    if ("destinationId" in json) {
      data.destination = json.destinationId
        ? { connect: { id: String(json.destinationId) } }
        : { disconnect: true };
    }

    if (Array.isArray(json.categoryIds)) {
      data.categories = {
        deleteMany: {},
        create: json.categoryIds
          .filter((categoryId: unknown) => typeof categoryId === "string")
          .map((categoryId: string) => ({ category: { connect: { id: categoryId } } })),
      };
    }

    if (Array.isArray(json.tagNames)) {
      const names = [
        ...new Set(
          json.tagNames
            .filter((name: unknown) => typeof name === "string")
            .map((name: string) => name.trim().slice(0, 60))
            .filter(Boolean)
        ),
      ] as string[];
      const tags = await Promise.all(
        names
          .filter((name) => slugify(name))
          .map((name) =>
            prisma.tag.upsert({
              where: { slug: slugify(name) },
              update: {},
              create: { name, slug: slugify(name) },
              select: { id: true },
            })
          )
      );
      data.tags = { deleteMany: {}, create: tags.map((tag) => ({ tag: { connect: { id: tag.id } } })) };
    }

    const nextStatus = (data.status as string | undefined) ?? existing.status;
    const nextDate = "publishDate" in data ? (data.publishDate as Date | null) : existing.publishDate;
    if (nextStatus === "Scheduled" && !nextDate) {
      return badRequest("Pick the date and time this post should go live");
    }

    const post = await prisma.blogPost.update({
      where: { id },
      data,
    });

    // Drafts aren't public, so editing one doesn't need to refresh what visitors see
    if (existing.status.toLowerCase() !== "draft" || post.status !== "Draft") {
      refreshPublicPages(POSTS_TAG);
    }

    if (post.status !== existing.status) {
      const verb =
        post.status === "Published" ? "Published" : post.status === "Scheduled" ? "Scheduled" : "Unpublished";
      await logActivity(session.user.id, `${verb} post "${post.title}"`, "Blog", { postId: id });
      await saveRevision(id, session.user.id, verb);
    } else if (!autosave) {
      await logActivity(session.user.id, `Updated post "${post.title}"`, "Blog", { postId: id });
      await saveRevision(id, session.user.id, "Saved");
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error("[BLOG_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Moves the post to the trash; ?permanent=1 deletes a post that's already in the trash
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const permanent = new URL(req.url).searchParams.get("permanent") === "1";
    const existing = await prisma.blogPost.findUnique({ where: { id }, select: { deletedAt: true } });
    if (!existing) return new NextResponse("Not Found", { status: 404 });

    if (permanent) {
      if (!existing.deletedAt) return badRequest("Move the post to the trash first");
      const post = await prisma.blogPost.delete({ where: { id } });
      await logActivity(session.user.id, `Deleted post "${post.title}" for good`, "Blog", { postId: id });
    } else {
      const post = await prisma.blogPost.update({ where: { id }, data: { deletedAt: new Date() } });
      refreshPublicPages(POSTS_TAG);
      await logActivity(session.user.id, `Moved post "${post.title}" to the trash`, "Blog", { postId: id });
    }

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[BLOG_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
