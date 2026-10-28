import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { CONTENT_TAG } from "@/lib/content";
import { CONTENT_KINDS, cleanContentData } from "@/lib/content-kinds";
import { refreshPublicPages } from "@/lib/site";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const existing = await prisma.contentItem.findUnique({ where: { id } });
    const kind = existing && CONTENT_KINDS[existing.kind];
    if (!existing || !kind) return new NextResponse("Not Found", { status: 404 });

    const json = await req.json();
    const data: Prisma.ContentItemUpdateInput = {};
    if ("data" in json) {
      const cleaned = cleanContentData(kind, json.data);
      if ("error" in cleaned) return NextResponse.json({ message: cleaned.error }, { status: 400 });
      data.data = cleaned.data;
    }
    if ("isHidden" in json) data.isHidden = json.isHidden === true;

    const item = await prisma.contentItem.update({ where: { id }, data });

    refreshPublicPages(CONTENT_TAG);
    const what = "data" in json ? "Edited" : item.isHidden ? "Hid" : "Showed";
    await logActivity(session.user.id, `${what} ${kind.singular} in ${kind.title}`, "Site Content", {
      itemId: id,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("[CONTENT_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const item = await prisma.contentItem.delete({ where: { id } });
    const kind = CONTENT_KINDS[item.kind];

    refreshPublicPages(CONTENT_TAG);
    await logActivity(
      session.user.id,
      `Deleted ${kind?.singular ?? "item"} from ${kind?.title ?? item.kind}`,
      "Site Content",
      { itemId: id }
    );
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CONTENT_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
