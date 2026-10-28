import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { authorize } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

// Paths the site itself needs; redirecting them would break the site or the admin panel
const RESERVED = /^\/(admin|api|login|_next)(\/|$)/;

function cleanPath(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return "";
  // Pasting a full address of this site keeps just the path
  const path = text.replace(/^https?:\/\/(www\.)?weddinggoosebumps\.com/i, "") || "/";
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export async function GET() {
  try {
    const access = await authorize(null);
    if ("denied" in access) return access.denied;

    const redirects = await prisma.redirect.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(redirects);
  } catch (error) {
    console.error("[REDIRECTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const access = await authorize("seo");
    if ("denied" in access) return access.denied;
    const { session } = access;

    const json = await req.json();
    const source = cleanPath(json.source);
    const destination = typeof json.destination === "string" ? json.destination.trim() : "";
    const target = destination.startsWith("/") ? cleanPath(destination) : destination;

    if (!source.startsWith("/") || source === "/") {
      return NextResponse.json({ message: "The old address must start with / (for example /old-page)" }, { status: 400 });
    }
    if (RESERVED.test(source)) {
      return NextResponse.json({ message: "Addresses under /admin, /api and /login can't be redirected" }, { status: 400 });
    }
    if (!target.startsWith("/") && !/^https:\/\//i.test(target)) {
      return NextResponse.json({ message: "The new address must start with / or https://" }, { status: 400 });
    }
    if (target === source) {
      return NextResponse.json({ message: "The two addresses are the same" }, { status: 400 });
    }
    if (await prisma.redirect.findFirst({ where: { source: target, destination: source } })) {
      return NextResponse.json({ message: "That would loop with an existing redirect" }, { status: 400 });
    }
    if (await prisma.redirect.findUnique({ where: { source } })) {
      return NextResponse.json({ message: `${source} already redirects somewhere` }, { status: 409 });
    }

    const redirect = await prisma.redirect.create({
      data: { source, destination: target, permanent: json.permanent !== false },
    });
    await logActivity(session.user.id, `Added redirect ${source} → ${target}`, "Redirects");
    return NextResponse.json(redirect);
  } catch (error) {
    console.error("[REDIRECTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
