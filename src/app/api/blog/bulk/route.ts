import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { POSTS_TAG } from "@/lib/posts";
import { refreshPublicPages } from "@/lib/site";

// Several posts at once from the posts list: publish, back to draft, trash, restore, delete for good
export async function PATCH(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { ids, action } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      return NextResponse.json({ message: "Pick at least one post" }, { status: 400 });
    }

    let count = 0;
    let verb = "";
    switch (action) {
      case "publish":
        ({ count } = await prisma.blogPost.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { status: "Published" },
        }));
        verb = "Published";
        break;
      case "draft":
        ({ count } = await prisma.blogPost.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { status: "Draft" },
        }));
        verb = "Unpublished";
        break;
      case "trash":
        ({ count } = await prisma.blogPost.updateMany({
          where: { id: { in: ids }, deletedAt: null },
          data: { deletedAt: new Date() },
        }));
        verb = "Moved to the trash";
        break;
      case "restore":
        ({ count } = await prisma.blogPost.updateMany({
          where: { id: { in: ids }, deletedAt: { not: null } },
          data: { deletedAt: null },
        }));
        verb = "Restored";
        break;
      case "purge":
        ({ count } = await prisma.blogPost.deleteMany({
          where: { id: { in: ids }, deletedAt: { not: null } },
        }));
        verb = "Deleted for good";
        break;
      default:
        return NextResponse.json({ message: "Unknown action" }, { status: 400 });
    }

    refreshPublicPages(POSTS_TAG);
    await logActivity(session.user.id, `${verb} ${count} post${count === 1 ? "" : "s"}`, "Blog", { ids });
    return NextResponse.json({ count });
  } catch (error) {
    console.error("[BLOG_BULK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
