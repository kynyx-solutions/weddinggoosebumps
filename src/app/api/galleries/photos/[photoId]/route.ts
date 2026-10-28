import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { GALLERIES_TAG } from "@/lib/galleries";
import { refreshPublicPages } from "@/lib/site";

// The photo's description (alt text)
export async function PUT(req: Request, { params }: { params: Promise<{ photoId: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;

    const { photoId } = await params;
    const { alt } = await req.json();
    const photo = await prisma.galleryPhoto.update({
      where: { id: photoId },
      data: { alt: typeof alt === "string" && alt.trim() ? alt.trim().slice(0, 191) : null },
    });
    refreshPublicPages(GALLERIES_TAG);
    return NextResponse.json(photo);
  } catch (error) {
    console.error("[GALLERY_PHOTO_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Removes the photo from the album; the image file itself stays in the media library
export async function DELETE(req: Request, { params }: { params: Promise<{ photoId: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;

    const { photoId } = await params;
    await prisma.galleryPhoto.delete({ where: { id: photoId } });
    refreshPublicPages(GALLERIES_TAG);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[GALLERY_PHOTO_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
