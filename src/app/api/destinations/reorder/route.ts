import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { DESTINATIONS_TAG } from "@/lib/destinations";
import { refreshPublicPages } from "@/lib/site";

export async function PUT(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;

    const { ids } = await req.json();
    if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string")) {
      return NextResponse.json({ message: "Invalid order" }, { status: 400 });
    }

    await prisma.$transaction(
      ids.map((id: string, index: number) =>
        prisma.destination.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    refreshPublicPages(DESTINATIONS_TAG);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DESTINATION_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
