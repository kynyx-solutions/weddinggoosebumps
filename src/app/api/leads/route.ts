import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { name, email, phone, message, sourcePage } = json;

    if (!name || !email) {
      return new NextResponse("Name and email are required", { status: 400 });
    }

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        message,
        sourcePage,
        status: "New",
      },
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("[LEAD_SUBMISSION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
