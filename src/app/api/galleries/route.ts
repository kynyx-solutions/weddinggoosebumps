import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { GALLERIES_TAG } from "@/lib/galleries";
import { slugify } from "@/lib/slug";
import { refreshPublicPages } from "@/lib/site";

// A new, empty album; photos are added on its own page
export async function POST(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const heading = typeof json.heading === "string" ? json.heading.trim().slice(0, 120) : "";
    const subheading = typeof json.subheading === "string" ? json.subheading.trim().slice(0, 120) : "";
    const coverImage = typeof json.coverImage === "string" ? json.coverImage.trim() : "";
    if (!heading) return NextResponse.json({ message: "Enter a heading" }, { status: 400 });
    if (!coverImage) return NextResponse.json({ message: "Choose a cover photo" }, { status: 400 });

    // Built-in albums use numbers (1–10); new ones get a readable address from the couple's names
    const base = slugify(subheading || heading) || "album";
    let slug = base;
    for (let n = 2; await prisma.gallery.findUnique({ where: { slug } }); n++) slug = `${base}-${n}`;

    const last = await prisma.gallery.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const album = await prisma.gallery.create({
      data: { heading, subheading: subheading || null, coverImage, slug, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });

    refreshPublicPages(GALLERIES_TAG);
    await logActivity(session.user.id, `Added album "${heading}"`, "Galleries", { galleryId: album.id });
    return NextResponse.json(album);
  } catch (error) {
    console.error("[GALLERY_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
