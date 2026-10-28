import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { ROLES } from "@/lib/permissions";

const MIN_PASSWORD = 8;

// There must always be at least one Super Admin left
async function isLastSuperAdmin(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (user?.role !== "Super Admin") return false;
  return (await prisma.user.count({ where: { role: "Super Admin" } })) <= 1;
}

// Change someone's name, role, or set a new password for them
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("users");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const json = await req.json();
    const data: Prisma.UserUpdateInput = {};

    if ("name" in json) {
      const name = String(json.name ?? "").trim().slice(0, 100);
      if (!name) return NextResponse.json({ message: "Enter a name" }, { status: 400 });
      data.name = name;
    }
    if ("role" in json) {
      if (!(ROLES as readonly string[]).includes(json.role)) {
        return NextResponse.json({ message: "Pick a role" }, { status: 400 });
      }
      if (json.role !== "Super Admin" && (await isLastSuperAdmin(id))) {
        return NextResponse.json({ message: "Keep at least one Super Admin" }, { status: 400 });
      }
      data.role = json.role;
    }
    if ("password" in json) {
      const password = String(json.password ?? "");
      if (password.length < MIN_PASSWORD) {
        return NextResponse.json({ message: `The password needs at least ${MIN_PASSWORD} characters` }, { status: 400 });
      }
      data.password = await bcrypt.hash(password, 10);
      data.failedLogins = 0;
      data.lockedUntil = null;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    const what = "password" in json ? "Set a new password for" : "Updated user";
    await logActivity(session.user.id, `${what} ${user.email}`, "Users");
    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("users");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    if (id === session.user.id) {
      return NextResponse.json({ message: "You can't remove yourself" }, { status: 400 });
    }
    if (await isLastSuperAdmin(id)) {
      return NextResponse.json({ message: "Keep at least one Super Admin" }, { status: 400 });
    }

    const user = await prisma.user.delete({ where: { id }, select: { email: true } });
    await logActivity(session.user.id, `Removed user ${user.email}`, "Users");
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[USERS_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
