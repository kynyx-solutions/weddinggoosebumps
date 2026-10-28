import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { CONTENT_TAG } from "@/lib/content";
import { CONTENT_KINDS, cleanContentData } from "@/lib/content-kinds";
import { refreshPublicPages } from "@/lib/site";

export async function GET(req: Request) {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const kind = new URL(req.url).searchParams.get("kind") ?? "";
    if (!CONTENT_KINDS[kind]) return NextResponse.json({ message: "Unknown list" }, { status: 400 });

    const items = await prisma.contentItem.findMany({
      where: { kind },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("[CONTENT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await authorize("content");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const kind = CONTENT_KINDS[json.kind];
    if (!kind) return NextResponse.json({ message: "Unknown list" }, { status: 400 });

    const cleaned = cleanContentData(kind, json.data);
    if ("error" in cleaned) return NextResponse.json({ message: cleaned.error }, { status: 400 });

    const count = await prisma.contentItem.count({ where: { kind: kind.kind } });
    if (kind.limit && count >= kind.limit) {
      return NextResponse.json(
        { message: `You can add up to ${kind.limit} ${kind.title.toLowerCase()}` },
        { status: 400 }
      );
    }

    const last = await prisma.contentItem.findFirst({
      where: { kind: kind.kind },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const item = await prisma.contentItem.create({
      data: { kind: kind.kind, data: cleaned.data, sortOrder: (last?.sortOrder ?? -1) + 1 },
    });

    refreshPublicPages(CONTENT_TAG);
    await logActivity(session.user.id, `Added ${kind.singular} to ${kind.title}`, "Site Content", {
      itemId: item.id,
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("[CONTENT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
