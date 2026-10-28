import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";

// Saves an image's description (alt text) in the media library
export async function PUT(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;

    const { url, alt } = await req.json();
    if (typeof url !== "string" || !url.startsWith("/uploads/")) {
      return NextResponse.json({ message: "Unknown image" }, { status: 400 });
    }
    const text = typeof alt === "string" ? alt.trim().slice(0, 500) : "";

    await prisma.mediaAsset.upsert({
      where: { url },
      update: { alt: text || null },
      create: { url, alt: text || null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[MEDIA_ALT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
