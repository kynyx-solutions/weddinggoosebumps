import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { PAGES_TAG } from "@/lib/seo";
import { refreshPublicPages } from "@/lib/site";

export async function POST(req: Request) {
  try {
    const access = await authorize("seo");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const { title, slug, status } = json;

    if (!title || !slug) {
      return new NextResponse("Missing title or slug", { status: 400 });
    }

    const page = await prisma.page.create({
      data: {
        title,
        slug,
        status: status || "Draft",
      },
    });

    refreshPublicPages(PAGES_TAG);
    await logActivity(session.user.id, `Created page ${page.slug}`, "Pages", { pageId: page.id });

    return NextResponse.json(page);
  } catch (error) {
    console.error("[PAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
