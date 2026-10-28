import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { DESTINATIONS_TAG } from "@/lib/destinations";
import { checkDestination, destinationData } from "@/lib/destination-fields";
import { POSTS_TAG } from "@/lib/posts";
import { slugify } from "@/lib/slug";
import { refreshPublicPages } from "@/lib/site";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const json = await req.json();

    // Just the show/hide switch from the list
    if (Object.keys(json).length === 1 && "isHidden" in json) {
      const destination = await prisma.destination.update({
        where: { id },
        data: { isHidden: json.isHidden === true },
      });
      refreshPublicPages(DESTINATIONS_TAG);
      return NextResponse.json(destination);
    }

    const problem = checkDestination(json);
    if (problem) return NextResponse.json({ message: problem }, { status: 400 });

    const slug = slugify(String(json.slug || json.name));
    if (!slug) return NextResponse.json({ message: "The address needs a letter or number" }, { status: 400 });
    const clash = await prisma.destination.findFirst({ where: { slug, NOT: { id } } });
    if (clash) return NextResponse.json({ message: `Another destination already uses "${slug}"` }, { status: 409 });

    const destination = await prisma.destination.update({
      where: { id },
      data: { ...destinationData(json), slug },
    });

    refreshPublicPages(DESTINATIONS_TAG);
    await logActivity(session.user.id, `Updated destination "${destination.name}"`, "Destinations", {
      destinationId: id,
    });
    return NextResponse.json(destination);
  } catch (error) {
    console.error("[DESTINATION_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Posts linked to it stay; they just lose the link
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const destination = await prisma.destination.delete({ where: { id } });

    refreshPublicPages(DESTINATIONS_TAG, POSTS_TAG);
    await logActivity(session.user.id, `Deleted destination "${destination.name}"`, "Destinations");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DESTINATION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
