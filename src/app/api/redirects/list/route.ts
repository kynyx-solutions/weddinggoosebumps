import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Read by the middleware (which can't use the database itself). Redirects are public behaviour
// anyway, so this needs no login.
export async function GET() {
  try {
    const redirects = await prisma.redirect.findMany({
      select: { source: true, destination: true, permanent: true },
    });
    return NextResponse.json(redirects, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[REDIRECTS_LIST]", error);
    return NextResponse.json([], { status: 500 });
  }
}
