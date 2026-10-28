import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { GALLERIES_TAG } from "@/lib/galleries";
import { refreshPublicPages } from "@/lib/site";

// Adds photos to the end of an album. The browser measures each one, since the page lays
// photos out by their real proportions.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const { photos } = await req.json();
    const valid = Array.isArray(photos)
      ? photos.filter(
          (p) =>
            typeof p?.src === "string" &&
            p.src.trim() &&
            Number.isInteger(p.width) &&
            Number.isInteger(p.height) &&
            p.width > 0 &&
            p.height > 0
        )
      : [];
    if (valid.length === 0) return NextResponse.json({ message: "No photos to add" }, { status: 400 });

    const last = await prisma.galleryPhoto.findFirst({
      where: { galleryId: id },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const start = (last?.sortOrder ?? -1) + 1;
    await prisma.galleryPhoto.createMany({
      data: valid.map((p, index) => ({
        galleryId: id,
        src: p.src.trim().slice(0, 512),
        width: p.width,
        height: p.height,
        alt: typeof p.alt === "string" && p.alt.trim() ? p.alt.trim().slice(0, 191) : null,
        sortOrder: start + index,
      })),
    });

    const added = await prisma.galleryPhoto.findMany({
      where: { galleryId: id, sortOrder: { gte: start } },
      orderBy: { sortOrder: "asc" },
    });
    refreshPublicPages(GALLERIES_TAG);
    await logActivity(session.user.id, `Added ${valid.length} photo${valid.length === 1 ? "" : "s"} to an album`, "Galleries", {
      galleryId: id,
    });
    return NextResponse.json(added);
  } catch (error) {
    console.error("[GALLERY_PHOTOS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
