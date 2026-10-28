import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { PAGES_TAG } from "@/lib/seo";
import { refreshPublicPages } from "@/lib/site";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("seo");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const json = await req.json();
    const { 
      title, 
      slug, 
      metaTitle,
      metaKeywords,
      metaDescription,
      canonicalUrl,
      ogTitle,
      ogDescription,
      ogImage,
      robots,
      structuredData
    } = json;

    const page = await prisma.page.update({
      where: { id },
      data: { 
        title, 
        slug,
        metaTitle,
        metaKeywords,
        metaDescription,
        canonicalUrl,
        ogTitle,
        ogDescription,
        ogImage,
        robots,
        structuredData
      },
    });

    refreshPublicPages(PAGES_TAG);
    await logActivity(session.user.id, `Updated SEO for ${page.slug}`, "Pages", { pageId: id });

    return NextResponse.json(page);
  } catch (error) {
    console.error("[PAGE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
