import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// The settings this screen owns; contact details are saved from Site Settings instead
const SEO_FIELDS = [
  "defaultMetaTitle",
  "defaultMetaKeywords",
  "defaultMetaDesc",
  "defaultOgImage",
  "gaId",
  "gtmId",
  "metaPixelId",
  "linkedinInsightTag",
  "robotsTxt",
] as const;

export async function GET() {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" }
    });

    return NextResponse.json(settings || {});
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const access = await authorize("seo");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const data: Record<string, string | null> = {};
    for (const field of SEO_FIELDS) {
      if (field in json) data[field] = typeof json[field] === "string" ? json[field] : null;
    }

    const settings = await prisma.globalSettings.upsert({
      where: { id: "global" },
      update: data,
      create: { id: "global", ...data }
    });
    await logActivity(session.user.id, "Updated global SEO settings", "SEO");

    return NextResponse.json(settings);
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 });
  }
}
