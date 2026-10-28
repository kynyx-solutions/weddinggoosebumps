import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { POSTS_TAG, slugify } from "@/lib/posts";
import { refreshPublicPages } from "@/lib/site";

export async function GET() {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const [categories, tags] = await Promise.all([
      prisma.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } }),
      prisma.tag.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { posts: true } } } }),
    ]);
    return NextResponse.json({ categories, tags });
  } catch (error) {
    console.error("[TAXONOMY_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { type, name } = await req.json();
    const clean = typeof name === "string" ? name.trim().slice(0, 60) : "";
    const slug = slugify(clean);
    if (type !== "category" && type !== "tag") {
      return NextResponse.json({ message: "Unknown type" }, { status: 400 });
    }
    if (!slug) return NextResponse.json({ message: "Enter a name" }, { status: 400 });

    const where = { OR: [{ slug }, { name: clean }] };
    const exists =
      type === "category"
        ? await prisma.category.findFirst({ where })
        : await prisma.tag.findFirst({ where });
    if (exists) return NextResponse.json({ message: `"${clean}" already exists` }, { status: 409 });

    const item =
      type === "category"
        ? await prisma.category.create({ data: { name: clean, slug } })
        : await prisma.tag.create({ data: { name: clean, slug } });
    refreshPublicPages(POSTS_TAG);
    await logActivity(session.user.id, `Added ${type} "${clean}"`, "Blog");
    return NextResponse.json(item);
  } catch (error) {
    console.error("[TAXONOMY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
