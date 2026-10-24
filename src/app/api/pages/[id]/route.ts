import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    return NextResponse.json(page);
  } catch (error) {
    console.error("[PAGE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
