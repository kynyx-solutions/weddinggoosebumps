import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { describeChanges, type PostSnapshot } from "@/lib/revisions";

// Saved versions of a post, newest first, each with what changed since the one before it
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const { id } = await params;
    const revisions = await prisma.postRevision.findMany({
      where: { postId: id },
      orderBy: { createdAt: "asc" },
    });
    const userIds = [...new Set(revisions.map((r) => r.userId).filter(Boolean))] as string[];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const list = revisions.map((revision, index) => {
      const user = users.find((u) => u.id === revision.userId);
      return {
        id: revision.id,
        label: revision.label,
        createdAt: revision.createdAt,
        by: user?.name || user?.email || "Someone",
        changes: describeChanges(
          index > 0 ? (revisions[index - 1].snapshot as unknown as PostSnapshot) : null,
          revision.snapshot as unknown as PostSnapshot
        ),
      };
    });

    return NextResponse.json(list.reverse());
  } catch (error) {
    console.error("[REVISIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
