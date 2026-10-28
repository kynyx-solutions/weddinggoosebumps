import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { ROLES } from "@/lib/permissions";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

export async function POST(req: Request) {
  try {
    const access = await authorize("users");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const name = typeof json.name === "string" ? json.name.trim().slice(0, 100) : "";
    const email = typeof json.email === "string" ? json.email.trim().toLowerCase().slice(0, 191) : "";
    const password = typeof json.password === "string" ? json.password : "";
    const role = String(json.role ?? "");

    if (!name) return NextResponse.json({ message: "Enter a name" }, { status: 400 });
    if (!EMAIL_PATTERN.test(email)) return NextResponse.json({ message: "Enter a valid email" }, { status: 400 });
    if (password.length < MIN_PASSWORD) {
      return NextResponse.json({ message: `The password needs at least ${MIN_PASSWORD} characters` }, { status: 400 });
    }
    if (!(ROLES as readonly string[]).includes(role)) {
      return NextResponse.json({ message: "Pick a role" }, { status: 400 });
    }
    if (await prisma.user.findUnique({ where: { email } })) {
      return NextResponse.json({ message: "Someone already uses that email" }, { status: 409 });
    }

    const user = await prisma.user.create({
      data: { name, email, role, password: await bcrypt.hash(password, 10) },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    await logActivity(session.user.id, `Added user ${email} (${role})`, "Users");
    return NextResponse.json(user);
  } catch (error) {
    console.error("[USERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
