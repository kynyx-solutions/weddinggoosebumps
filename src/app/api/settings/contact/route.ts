import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { refreshPublicPages } from "@/lib/site";

const CONTACT_SELECT = {
  whatsappNumber: true,
  whatsappMessage: true,
  whatsappEventMessage: true,
  contactAddress: true,
  mapUrl: true,
  showMap: true,
} as const;

export async function GET() {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
      select: CONTACT_SELECT,
    });
    return NextResponse.json(settings ?? {});
  } catch (error) {
    console.error("[CONTACT_SETTINGS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

function text(value: unknown, max: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;
}

export async function PUT(req: Request) {
  try {
    const access = await authorize("settings");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();

    // Stored as digits with the country code, the way wa.me links need it ("917004734213")
    const whatsappNumber = text(json.whatsappNumber, 40)?.replace(/\D/g, "") || null;
    if (whatsappNumber && (whatsappNumber.length < 10 || whatsappNumber.length > 15)) {
      return NextResponse.json(
        { message: "Enter the WhatsApp number with its country code, e.g. +91 70047 34213" },
        { status: 400 }
      );
    }

    const mapUrl = text(json.mapUrl, 2000);
    if (mapUrl && !/^https:\/\//i.test(mapUrl)) {
      return NextResponse.json({ message: "The map link must start with https://" }, { status: 400 });
    }

    // The map fields are only changed when sent: Site Settings no longer shows them, and saving
    // there must not switch the Inquire page's map off
    const data = {
      whatsappNumber,
      whatsappMessage: text(json.whatsappMessage, 1000),
      whatsappEventMessage: text(json.whatsappEventMessage, 1000),
      contactAddress: text(json.contactAddress, 1000),
      ...("mapUrl" in json && { mapUrl }),
      ...("showMap" in json && { showMap: json.showMap === true }),
    };

    const settings = await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: data,
      create: { id: "global", ...data },
      select: CONTACT_SELECT,
    });

    refreshPublicPages("settings");
    await logActivity(session.user.id, "Updated contact and WhatsApp settings", "Settings");

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[CONTACT_SETTINGS_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
