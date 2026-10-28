import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { GALLERIES_TAG } from "@/lib/galleries";
import { refreshPublicPages } from "@/lib/site";

// The album card (heading, couple, cover) or its show/hide switch
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const json = await req.json();
    const data: Prisma.GalleryUpdateInput = {};

    if ("heading" in json) {
      const heading = String(json.heading ?? "").trim().slice(0, 120);
      if (!heading) return NextResponse.json({ message: "Enter a heading" }, { status: 400 });
      data.heading = heading;
    }
    if ("subheading" in json) data.subheading = String(json.subheading ?? "").trim().slice(0, 120) || null;
    if ("coverImage" in json) {
      const cover = String(json.coverImage ?? "").trim();
      if (!cover) return NextResponse.json({ message: "Choose a cover photo" }, { status: 400 });
      data.coverImage = cover;
    }
    if ("isHidden" in json) data.isHidden = json.isHidden === true;

    const album = await prisma.gallery.update({ where: { id }, data });
    refreshPublicPages(GALLERIES_TAG);
    await logActivity(session.user.id, `Updated album "${album.heading}"`, "Galleries", { galleryId: id });
    return NextResponse.json(album);
  } catch (error) {
    console.error("[GALLERY_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const album = await prisma.gallery.delete({ where: { id } });
    refreshPublicPages(GALLERIES_TAG);
    await logActivity(session.user.id, `Deleted album "${album.heading}"`, "Galleries");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[GALLERY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
