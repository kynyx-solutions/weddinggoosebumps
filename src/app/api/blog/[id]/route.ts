import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;

    const data = await req.json();

    const post = await prisma.blogPost.update({
      where: { id },
      data,
    });

    return NextResponse.json(post);
  } catch (error) {
    console.error("[BLOG_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
//   try {
//     const session = await auth();
//     if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

//     const { id } = await params;
//     const json = await req.json();
//     const { 
//       title, slug, authorId, coverImage, excerpt, body, status, publishDate,
//       metaTitle,metaKeywords,metaDescription, canonicalUrl, ogTitle, ogDescription, ogImage, structuredData, robots 
//     } = json;

//     const post = await prisma.blogPost.update({
//       where: { id },
//       data: {
//         title, slug, authorId, coverImage, excerpt, body, status, publishDate,
//         metaTitle,metaKeywords,metaDescription, canonicalUrl, ogTitle, ogDescription, ogImage, structuredData, robots
//       },
//     });

//     return NextResponse.json(post);
//   } catch (error) {
//     console.error("[BLOG_PUT]", error);
//     return new NextResponse("Internal Error", { status: 500 });
//   }
// }

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    await prisma.blogPost.delete({ where: { id } });

    return new NextResponse("Deleted", { status: 200 });
  } catch (error) {
    console.error("[BLOG_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
