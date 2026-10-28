import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { slugify, slugTakenMessage } from "@/lib/posts";

export async function POST(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const title = typeof json.title === "string" ? json.title.trim() : "";
    // The address defaults to the title ("Our Udaipur Wedding" → our-udaipur-wedding)
    const slug = slugify(typeof json.slug === "string" && json.slug.trim() ? json.slug : title);

    if (!title) {
      return NextResponse.json({ message: "Please enter a title" }, { status: 400 });
    }
    if (!slug) {
      return NextResponse.json(
        { message: "The address needs at least one letter or number" },
        { status: 400 }
      );
    }

    const taken = await slugTakenMessage(slug);
    if (taken) return NextResponse.json({ message: taken }, { status: 409 });

    const post = await prisma.blogPost.create({
      data: { title, slug, status: "Draft" },
    });
    await logActivity(session.user.id, `Created post "${title}"`, "Blog", { postId: post.id });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[BLOG_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
