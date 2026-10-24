import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

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

    return NextResponse.json(page);
  } catch (error) {
    console.error("[PAGES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
