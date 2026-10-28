import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { DESTINATIONS_TAG } from "@/lib/destinations";
import { checkDestination, destinationData } from "@/lib/destination-fields";
import { slugify } from "@/lib/slug";
import { refreshPublicPages } from "@/lib/site";

export async function POST(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const problem = checkDestination(json);
    if (problem) return NextResponse.json({ message: problem }, { status: 400 });

    const slug = slugify(String(json.slug || json.name));
    if (!slug) return NextResponse.json({ message: "The address needs a letter or number" }, { status: 400 });
    if (await prisma.destination.findUnique({ where: { slug } })) {
      return NextResponse.json({ message: `Another destination already uses "${slug}"` }, { status: 409 });
    }

    const last = await prisma.destination.findFirst({ orderBy: { sortOrder: "desc" }, select: { sortOrder: true } });
    const destination = await prisma.destination.create({
      data: { ...destinationData(json), slug, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });

    refreshPublicPages(DESTINATIONS_TAG);
    await logActivity(session.user.id, `Added destination "${destination.name}"`, "Destinations", {
      destinationId: destination.id,
    });
    return NextResponse.json(destination);
  } catch (error) {
    console.error("[DESTINATION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
