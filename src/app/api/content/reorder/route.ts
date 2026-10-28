import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/content";
import { CONTENT_KINDS } from "@/lib/content-kinds";
import { refreshPublicPages } from "@/lib/site";

// Saves the order after a drag in the admin list
export async function PUT(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;

    const { kind, ids } = await req.json();
    if (!CONTENT_KINDS[kind] || !Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
      return NextResponse.json({ message: "Invalid order" }, { status: 400 });
    }

    await prisma.$transaction(
      ids.map((id: string, index: number) =>
        prisma.contentItem.updateMany({ where: { id, kind }, data: { sortOrder: index } })
      )
    );

    refreshPublicPages(CONTENT_TAG);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONTENT_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
