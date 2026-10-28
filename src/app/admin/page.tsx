import Link from "next/link";
import { ExternalLink, FilePlus, Inbox, SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import prisma from "@/lib/prisma";
import { getCurrentRole, requireAdmin } from "@/lib/auth";
import { can, canSeeLeads } from "@/lib/permissions";
import { OPEN_LEAD_STATUSES } from "@/lib/leads";
import { RemoveActivityButton } from "@/components/admin/remove-activity";

const activityTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});
const shortDate = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
const indiaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

const DAY = 24 * 60 * 60 * 1000;

function StatCard({ title, value, note }: { title: string; value: React.ReactNode; note?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {note && <p className="text-xs text-gray-500">{note}</p>}
      </CardContent>
    </Card>
  );
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  await requireAdmin();
  const { denied } = await searchParams;
  const role = (await getCurrentRole()) ?? undefined;
  const showLeads = canSeeLeads(role);
  const canRemoveActivity = can(role, "activity");
  const now = Date.now();
  const notSpam = { status: { not: "Spam" } };
  // Follow-ups are dates in India time; anything up to the end of today is due
  const endOfToday = new Date(`${indiaDay.format(new Date())}T23:59:59.999+05:30`);

  const [
    pagesCount,
    blogCount,
    leadsCount,
    whatsappClicks,
    recentActivity,
    leadsWeek,
    leadsMonth,
    leadsTotal,
    leadsWon,
    followUpsDue,
    latestLeads,
    sources,
    drafts,
    scheduled,
  ] = await Promise.all([
    prisma.page.count(),
    prisma.blogPost.count({ where: { deletedAt: null } }),
    prisma.lead.count({ where: { status: "New" } }),
    prisma.whatsAppClick.count({ where: { createdAt: { gte: new Date(now - 30 * DAY) } } }),
    prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } } },
      take: 8,
    }),
    prisma.lead.count({ where: { ...notSpam, createdAt: { gte: new Date(now - 7 * DAY) } } }),
    prisma.lead.count({ where: { ...notSpam, createdAt: { gte: new Date(now - 30 * DAY) } } }),
    prisma.lead.count({ where: notSpam }),
    prisma.lead.count({ where: { status: { in: ["Qualified", "Closed"] } } }),
    prisma.lead.count({
      where: { status: { in: OPEN_LEAD_STATUSES }, followUpAt: { lte: endOfToday } },
    }),
    prisma.lead.findMany({
      where: notSpam,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, status: true, createdAt: true },
      take: 5,
    }),
    prisma.lead.groupBy({
      by: ["utmSource"],
      where: { ...notSpam, createdAt: { gte: new Date(now - 90 * DAY) } },
      _count: { _all: true },
    }),
    prisma.blogPost.findMany({
      where: { status: "Draft", deletedAt: null },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true },
      take: 5,
    }),
    prisma.blogPost.findMany({
      where: { status: "Scheduled", publishDate: { gt: new Date(now) }, deletedAt: null },
      orderBy: { publishDate: "asc" },
      select: { id: true, title: true, publishDate: true },
      take: 5,
    }),
  ]);

  const qualifiedRate = leadsTotal ? `${Math.round((leadsWon / leadsTotal) * 100)}%` : "-";
  const sourceRows = sources
    .map((row) => ({ source: row.utmSource || "Direct / not tagged", count: row._count._all }))
    .sort((a, b) => b.count - a.count);
  const sourceMax = Math.max(1, ...sourceRows.map((row) => row.count));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {denied && (
          <p className="w-full rounded-md bg-amber-50 px-4 py-2 text-sm text-amber-800">
            Your role can&apos;t open that page. Ask a Super Admin if you need it.
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/blog/new">
            <Button size="sm"><FilePlus className="mr-2 h-4 w-4" />New post</Button>
          </Link>
          <Link href="/admin/leads">
            <Button size="sm" variant="outline"><Inbox className="mr-2 h-4 w-4" />Leads inbox</Button>
          </Link>
          <Link href="/admin/settings">
            <Button size="sm" variant="outline"><SlidersHorizontal className="mr-2 h-4 w-4" />Site settings</Button>
          </Link>
          <a href="/" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline"><ExternalLink className="mr-2 h-4 w-4" />View website</Button>
          </a>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Pages" value={pagesCount} />
        <StatCard title="Blog Posts" value={blogCount} />
        <StatCard title="New Leads" value={leadsCount} />
        <StatCard title="WhatsApp Clicks" value={whatsappClicks} note="Last 30 days" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Leads this week" value={leadsWeek} note="Last 7 days, spam excluded" />
        <StatCard title="Leads this month" value={leadsMonth} note="Last 30 days, spam excluded" />
        <StatCard title="Qualified or closed" value={qualifiedRate} note={`${leadsWon} of ${leadsTotal} leads`} />
        <StatCard
          title="Follow-ups due"
          value={
            followUpsDue > 0 ? (
              <Link href="/admin/leads" className="text-amber-700 hover:underline">{followUpsDue}</Link>
            ) : (
              0
            )
          }
          note="Today or overdue"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {showLeads && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Latest leads</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {latestLeads.length === 0 ? (
              <p className="px-6 pb-6 text-sm text-gray-500">No leads yet.</p>
            ) : (
              <ul className="divide-y text-sm">
                {latestLeads.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/admin/leads?lead=${lead.id}`}
                      className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">{lead.name}</span>
                      <span className="text-xs text-gray-500">
                        {lead.status} · {shortDate.format(lead.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Where leads come from</CardTitle>
            <p className="text-xs text-gray-500">Last 90 days, by the ad or campaign tag (utm_source) in the link they came in on</p>
          </CardHeader>
          <CardContent>
            {sourceRows.length === 0 ? (
              <p className="text-sm text-gray-500">No leads in the last 90 days.</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {sourceRows.map((row) => (
                  <li key={row.source}>
                    <div className="flex justify-between">
                      <span className="text-gray-800">{row.source}</span>
                      <span className="font-medium text-gray-900">{row.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                      <div
                        className="h-1.5 rounded-full bg-[#C2A770]"
                        style={{ width: `${(row.count / sourceMax) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Posts waiting</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">Drafts</p>
            {drafts.length === 0 ? (
              <p className="text-sm text-gray-500">No drafts.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {drafts.map((post) => (
                  <li key={post.id} className="flex justify-between gap-3">
                    <Link href={`/admin/blog/${post.id}`} className="text-blue-600 hover:underline">{post.title}</Link>
                    <span className="shrink-0 text-xs text-gray-500">edited {shortDate.format(post.updatedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">Scheduled</p>
            {scheduled.length === 0 ? (
              <p className="text-sm text-gray-500">Nothing scheduled.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {scheduled.map((post) => (
                  <li key={post.id} className="flex justify-between gap-3">
                    <Link href={`/admin/blog/${post.id}`} className="text-blue-600 hover:underline">{post.title}</Link>
                    <span className="shrink-0 text-xs text-gray-500">
                      {post.publishDate ? activityTime.format(post.publishDate) : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="p-0">
            {recentActivity.length === 0 ? (
              <p className="p-6 text-gray-500">No recent activity.</p>
            ) : (
              <ul className="divide-y text-sm">
                {recentActivity.map((log) => (
                  <li key={log.id} className="flex flex-wrap items-baseline justify-between gap-2 px-6 py-3">
                    <span className="text-gray-900">
                      {log.action}
                      <span className="text-gray-500"> · {log.user?.name || log.user?.email || "System"}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      {activityTime.format(log.createdAt)}
                      {canRemoveActivity && <RemoveActivityButton id={log.id} action={log.action} />}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
