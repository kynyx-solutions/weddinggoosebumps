import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { GALLERIES_TAG } from "@/lib/galleries";
import { refreshPublicPages } from "@/lib/site";

// Album order on the Galleries page, or photo order inside one album (galleryId given)
export async function PUT(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;

    const { ids, galleryId } = await req.json();
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
      return NextResponse.json({ message: "Invalid order" }, { status: 400 });
    }

    await prisma.$transaction(
      ids.map((id: string, index: number) =>
        galleryId
          ? prisma.galleryPhoto.updateMany({ where: { id, galleryId }, data: { sortOrder: index } })
          : prisma.gallery.updateMany({ where: { id }, data: { sortOrder: index } })
      )
    );

    refreshPublicPages(GALLERIES_TAG);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GALLERY_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
