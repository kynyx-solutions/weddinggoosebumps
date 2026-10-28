import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Sent with navigator.sendBeacon, which posts the JSON as plain text
export async function POST(req: Request) {
  try {
    let page: string | null = null;
    try {
      const body = JSON.parse(await req.text());
      if (typeof body?.page === "string") page = body.page.slice(0, 512);
    } catch {
      // a click without a readable page is still a click
    }

    await prisma.whatsAppClick.create({ data: { page } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[WHATSAPP_CLICK]", error);
    return new NextResponse(null, { status: 500 });
  }
}
