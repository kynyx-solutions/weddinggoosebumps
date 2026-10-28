import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { LEAD_STATUSES } from "@/lib/leads";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorize("leads");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const { id } = await params;
    const json = await req.json();
    const data: Prisma.LeadUpdateInput = {};

    if ("status" in json) {
      if (!LEAD_STATUSES.includes(json.status)) {
        return new NextResponse("Unknown status", { status: 400 });
      }
      data.status = json.status;
    }
    if ("notes" in json) {
      data.notes = typeof json.notes === "string" && json.notes.trim() ? json.notes.slice(0, 20000) : null;
    }
    if ("assignedTo" in json) {
      data.assignedTo = typeof json.assignedTo === "string" && json.assignedTo ? json.assignedTo.slice(0, 191) : null;
    }
    // A calendar day in India time ("2026-11-02"); empty clears the reminder
    if ("followUpDate" in json) {
      if (!json.followUpDate) {
        data.followUpAt = null;
      } else if (typeof json.followUpDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(json.followUpDate)) {
        data.followUpAt = new Date(`${json.followUpDate}T00:00:00+05:30`);
      } else {
        return new NextResponse("Invalid follow-up date", { status: 400 });
      }
    }

    const lead = await prisma.lead.update({ where: { id }, data });
    await logActivity(session.user.id, `Updated lead "${lead.name}"`, "Leads", {
      leadId: id,
      fields: Object.keys(data),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[LEAD_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
