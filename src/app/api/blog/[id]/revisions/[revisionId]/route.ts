import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { POSTS_TAG, postPath, slugTakenMessage } from "@/lib/posts";
import { saveRevision, SNAPSHOT_FIELDS, type PostSnapshot } from "@/lib/revisions";
import { refreshPublicPages } from "@/lib/site";

// Restores a saved version. The current state is saved first, so a restore can itself be undone.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; revisionId: string }> }
) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id, revisionId } = await params;
    const revision = await prisma.postRevision.findFirst({ where: { id: revisionId, postId: id } });
    if (!revision) return new NextResponse("Not Found", { status: 404 });
    const snapshot = revision.snapshot as unknown as PostSnapshot;

    await saveRevision(id, session.user.id, "Before restore");

    const data: Record<string, unknown> = {};
    for (const field of SNAPSHOT_FIELDS) {
      if (field in snapshot.post) data[field] = snapshot.post[field];
    }
    // The old address may belong to another post by now; keep the current one then
    const current = await prisma.blogPost.findUnique({ where: { id }, select: { slug: true } });
    if (
      typeof data.slug === "string" &&
      current &&
      postPath(data.slug) !== postPath(current.slug) &&
      (await slugTakenMessage(postPath(data.slug), id))
    ) {
      delete data.slug;
    }
    if (typeof data.publishDate === "string") data.publishDate = new Date(data.publishDate);
    // A destination deleted since then can't be linked again
    if (data.destinationId) {
      const exists = await prisma.destination.findUnique({ where: { id: String(data.destinationId) } });
      if (!exists) data.destinationId = null;
    }

    await prisma.$transaction([
      prisma.blogPost.update({ where: { id }, data: data as Prisma.BlogPostUncheckedUpdateInput }),
      prisma.blogSection.deleteMany({ where: { blogId: id } }),
      prisma.blogSection.createMany({
        data: snapshot.sections.map((s) => ({
          blogId: id,
          section: s.section,
          content: s.content as Prisma.InputJsonValue,
        })),
      }),
    ]);

    refreshPublicPages(POSTS_TAG);
    await logActivity(session.user.id, "Restored an earlier version of a post", "Blog", {
      postId: id,
      revisionId,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REVISION_RESTORE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
