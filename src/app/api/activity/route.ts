import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";

// Removes activity-log entries (Super Admin only): the ones listed in `ids`, or with `all: true`
// every entry matching the log page's filters (`module`, `user`)
export async function DELETE(req: Request) {
  try {
    const access = await authorize("activity");
    if ("denied" in access) return access.denied;

    const json = await req.json().catch(() => ({}));
    let where: Prisma.ActivityLogWhereInput;
    if (json.all === true) {
      where = {
        ...(typeof json.module === "string" && json.module && { module: json.module }),
        ...(typeof json.user === "string" && json.user && { userId: json.user }),
      };
    } else {
      const ids = Array.isArray(json.ids)
        ? json.ids.filter((id: unknown): id is string => typeof id === "string").slice(0, 500)
        : [];
      if (ids.length === 0) {
        return NextResponse.json({ message: "Nothing selected" }, { status: 400 });
      }
      where = { id: { in: ids } };
    }

    const { count } = await prisma.activityLog.deleteMany({ where });
    return NextResponse.json({ removed: count });
  } catch (error) {
    console.error("[ACTIVITY_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
