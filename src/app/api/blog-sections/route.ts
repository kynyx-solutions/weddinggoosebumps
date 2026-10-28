import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { POSTS_TAG } from "@/lib/posts";
import { refreshPublicPages } from "@/lib/site";

// Saving a section of a live post refreshes the public pages; drafts aren't public yet
async function afterSave(userId: string | undefined, blogId: string, section: string, autosave: boolean) {
  const post = await prisma.blogPost.findUnique({
    where: { id: blogId },
    select: { title: true, status: true },
  });
  if (post && post.status.toLowerCase() !== "draft") refreshPublicPages(POSTS_TAG);
  if (post && !autosave) {
    await logActivity(userId, `Updated ${section} section of "${post.title}"`, "Blog", { postId: blogId });
  }
}
export async function POST(req: NextRequest) {
    try {
      const access = await authorize("content");
      if ("denied" in access) return access.denied;
      const { session } = access;
    const { blogId, section, content } = await req.json();
    const autosave = new URL(req.url).searchParams.get("autosave") === "1";

    if (!blogId || !section) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const existing = await prisma.blogSection.findFirst({
      where: {
        blogId,
        section,
      },
    });

    if (existing) {
      const updated = await prisma.blogSection.update({
        where: {
          id: existing.id,
        },
        data: {
          content,
        },
      });
      await afterSave(session.user.id, blogId, section, autosave);

      return NextResponse.json({
        success: true,
        message: "Section updated",
        data: updated,
      });
    }

    const created = await prisma.blogSection.create({
      data: {
        blogId,
        section,
        content,
      },
    });
    await afterSave(session.user.id, blogId, section, autosave);

    return NextResponse.json({
      success: true,
      message: "Section created",
      data: created,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Only the admin editor reads sections here; drafts must not be readable by visitors
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const { searchParams } = new URL(req.url);

    const blogId = searchParams.get("blogId");
    const section = searchParams.get("section");

    if (!blogId || !section) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields",
        },
        { status: 400 }
      );
    }

    const data = await prisma.blogSection.findFirst({
      where: {
        blogId,
        section,
      },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong",
      },
      {
        status: 500,
      }
    );
  }
}
