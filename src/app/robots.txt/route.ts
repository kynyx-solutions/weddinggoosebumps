import prisma from "@/lib/prisma";
import { DEFAULT_ROBOTS_TXT } from "@/lib/site";

// Copies on any other host (beta.weddinggoosebumps.com, *.vercel.app previews, localhost) ask
// search engines to stay out, so they never compete with the live site
const PRIMARY_HOSTS = ["weddinggoosebumps.com", "www.weddinggoosebumps.com"];

function text(body: string) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

export async function GET(req: Request) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "")
    .split(",")[0]
    .split(":")[0]
    .trim()
    .toLowerCase();

  if (!PRIMARY_HOSTS.includes(host)) {
    return text("User-agent: *\nDisallow: /\n");
  }

  try {
    const settings = await prisma.globalSettings.findUnique({
      where: { id: "global" },
      select: { robotsTxt: true },
    });
    const custom = settings?.robotsTxt?.trim();
    return text(custom ? `${custom}\n` : DEFAULT_ROBOTS_TXT);
  } catch (error) {
    console.error("[ROBOTS_TXT]", error);
    return text(DEFAULT_ROBOTS_TXT);
  }
}
