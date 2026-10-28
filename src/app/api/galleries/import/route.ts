import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { GALLERIES_TAG } from "@/lib/galleries";
import { refreshPublicPages } from "@/lib/site";
import { GALLERY_CARDS } from "@/app/galleries/gallery-cards";
import builtInPhotos from "@/app/galleries/image-gallery";

// One-time copy of the built-in albums into the database, in the same order with the same
// addresses (/galleries/1 ...), so the pages look exactly the same afterwards
export async function POST() {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    if ((await prisma.gallery.count()) > 0) {
      return NextResponse.json({ message: "Albums have already been imported" }, { status: 409 });
    }

    await prisma.$transaction(
      GALLERY_CARDS.map((card, index) =>
        prisma.gallery.create({
          data: {
            slug: card.slug,
            heading: card.heading,
            subheading: card.subheading,
            coverImage: card.image,
            sortOrder: index,
            photos: {
              create: (builtInPhotos[card.slug] ?? []).map((photo, photoIndex) => ({
                src: photo.src,
                width: photo.width,
                height: photo.height,
                alt: photo.alt ?? null,
                sortOrder: photoIndex,
              })),
            },
          },
        })
      )
    );

    refreshPublicPages(GALLERIES_TAG);
    await logActivity(session.user.id, `Imported ${GALLERY_CARDS.length} built-in albums`, "Galleries");
    return NextResponse.json({ imported: GALLERY_CARDS.length });
  } catch (error) {
    console.error("[GALLERY_IMPORT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
