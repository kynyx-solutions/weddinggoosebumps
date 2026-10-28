import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("seo");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const redirect = await prisma.redirect.delete({ where: { id } });
    await logActivity(session.user.id, `Removed redirect ${redirect.source}`, "Redirects");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[REDIRECTS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
