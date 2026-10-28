import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

const MIN_PASSWORD = 8;

// Any signed-in user changing their own password
export async function PUT(req: Request) {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { currentPassword, newPassword } = await req.json();
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user?.password || !(await bcrypt.compare(String(currentPassword ?? ""), user.password))) {
      return NextResponse.json({ message: "Your current password isn't right" }, { status: 400 });
    }
    if (String(newPassword ?? "").length < MIN_PASSWORD) {
      return NextResponse.json({ message: `The new password needs at least ${MIN_PASSWORD} characters` }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(String(newPassword), 10) },
    });
    await logActivity(user.id, "Changed their password", "Users");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ACCOUNT_PASSWORD]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
