import { NextResponse, type NextRequest } from "next/server";

// Applies the redirects set up in Admin → Redirects. The middleware can't reach the database,
// so it reads the list from /api/redirects/list and keeps it for a minute.
interface Rule {
  source: string;
  destination: string;
  permanent: boolean;
}

const REFRESH_MS = 60_000;
let cache: { rules: Map<string, Rule>; at: number } | null = null;
let loading: Promise<void> | null = null;

async function load(origin: string) {
  try {
    const res = await fetch(`${origin}/api/redirects/list`, { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const rules: Rule[] = await res.json();
    cache = { rules: new Map(rules.map((rule) => [rule.source.toLowerCase(), rule])), at: Date.now() };
  } catch {
    // Keep serving the site (and the old list, if any) when the list can't be fetched
    cache = { rules: cache?.rules ?? new Map(), at: Date.now() };
  }
}

export async function middleware(req: NextRequest) {
  if (!cache) {
    loading ??= load(req.nextUrl.origin).finally(() => (loading = null));
    await loading;
  } else if (Date.now() - cache.at > REFRESH_MS && !loading) {
    // Refresh in the background; this request uses the list we have
    loading = load(req.nextUrl.origin).finally(() => (loading = null));
  }

  const path = req.nextUrl.pathname.length > 1 ? req.nextUrl.pathname.replace(/\/+$/, "") : "/";
  const rule = cache?.rules.get(path.toLowerCase());
  if (!rule) return NextResponse.next();

  const target = new URL(rule.destination, req.nextUrl.origin);
  // Keep tracking tags like ?utm_source=... from the old link
  if (rule.destination.startsWith("/")) {
    req.nextUrl.searchParams.forEach((value, key) => {
      if (!target.searchParams.has(key)) target.searchParams.set(key, value);
    });
  }
  return NextResponse.redirect(target, rule.permanent ? 301 : 302);
}

// Pages only: not the admin panel, API, Next.js files or anything with a file extension
export const config = {
  matcher: ["/((?!api|admin|login|_next|.*\\..*).*)"],
};
