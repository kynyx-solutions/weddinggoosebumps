import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) || null : null;
}

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const name = clean(json.name, 191);
    const email = clean(json.email, 191);

    if (!name || !email) {
      return new NextResponse("Name and email are required", { status: 400 });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return new NextResponse("Please enter a valid email address", { status: 400 });
    }

    // At most 3 inquiries from one address in 10 minutes
    const recent = await prisma.lead.count({
      where: { email, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
    });
    if (recent >= 3) {
      return new NextResponse("Too many inquiries, please try again later", { status: 429 });
    }

    // Spam traps: a hidden field people never see, and a form sent faster than anyone can
    // type. Caught inquiries are kept as Spam rather than dropped, so a real one is never lost.
    const filledTrap = clean(json.wg_hp, 191) !== null;
    const tooFast = typeof json.elapsedMs === "number" && json.elapsedMs < 2000;

    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: clean(json.phone, 40),
        message: clean(json.message, 10000),
        sourcePage: clean(json.sourcePage, 191),
        utmSource: clean(json.utmSource, 191),
        utmMedium: clean(json.utmMedium, 191),
        utmCampaign: clean(json.utmCampaign, 191),
        status: filledTrap || tooFast ? "Spam" : "New",
      },
    });

    return NextResponse.json({ success: true, leadId: lead.id });
  } catch (error) {
    console.error("[LEAD_SUBMISSION]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
