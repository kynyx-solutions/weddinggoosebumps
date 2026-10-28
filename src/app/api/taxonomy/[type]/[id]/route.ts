import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { POSTS_TAG, slugify } from "@/lib/posts";
import { refreshPublicPages } from "@/lib/site";

// Rename; the web address (slug) follows the new name
export async function PUT(req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { type, id } = await params;
    if (type !== "category" && type !== "tag") return new NextResponse("Not Found", { status: 404 });

    const { name } = await req.json();
    const clean = typeof name === "string" ? name.trim().slice(0, 60) : "";
    const slug = slugify(clean);
    if (!slug) return NextResponse.json({ message: "Enter a name" }, { status: 400 });

    const where = { OR: [{ slug }, { name: clean }], NOT: { id } };
    const clash =
      type === "category"
        ? await prisma.category.findFirst({ where })
        : await prisma.tag.findFirst({ where });
    if (clash) return NextResponse.json({ message: `"${clean}" already exists` }, { status: 409 });

    const item =
      type === "category"
        ? await prisma.category.update({ where: { id }, data: { name: clean, slug } })
        : await prisma.tag.update({ where: { id }, data: { name: clean, slug } });
    refreshPublicPages(POSTS_TAG);
    await logActivity(session.user.id, `Renamed ${type} to "${clean}"`, "Blog");
    return NextResponse.json(item);
  } catch (error) {
    console.error("[TAXONOMY_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Posts keep existing; they just lose this category or tag
export async function DELETE(req: Request, { params }: { params: Promise<{ type: string; id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { type, id } = await params;
    if (type !== "category" && type !== "tag") return new NextResponse("Not Found", { status: 404 });

    const item =
      type === "category"
        ? await prisma.category.delete({ where: { id } })
        : await prisma.tag.delete({ where: { id } });
    refreshPublicPages(POSTS_TAG);
    await logActivity(session.user.id, `Deleted ${type} "${item.name}"`, "Blog");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[TAXONOMY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
