import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentRole, requireAdmin } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import ActivityTable from "./ActivityTable";

const PER_PAGE = 50;
const timeFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});
const selectClass = "h-9 rounded-md border border-slate-200 bg-white px-3 text-sm";

export default async function ActivityLogsList({
  searchParams,
}: {
  searchParams: Promise<{ module?: string; user?: string; page?: string }>;
}) {
  await requireAdmin();
  const canRemove = can((await getCurrentRole()) ?? undefined, "activity");
  const { module, user, page: pageParam } = await searchParams;
  const where = {
    ...(module && { module }),
    ...(user && { userId: user }),
  };

  const [total, modules, users] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({ distinct: ["module"], select: { module: true }, orderBy: { module: "asc" } }),
    prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { createdAt: "asc" } }),
  ]);
  const pageCount = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), pageCount);
  const logs = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { user: true },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  const href = (p: number) => {
    const params = new URLSearchParams();
    if (module) params.set("module", module);
    if (user) params.set("user", user);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return query ? `/admin/logs?${query}` : "/admin/logs";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
      </div>

      <form className="flex flex-wrap items-center gap-3">
        <select name="module" defaultValue={module ?? ""} className={selectClass} aria-label="Area">
          <option value="">All areas</option>
          {modules.map((m) => (
            <option key={m.module} value={m.module}>{m.module}</option>
          ))}
        </select>
        <select name="user" defaultValue={user ?? ""} className={selectClass} aria-label="Person">
          <option value="">Everyone</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name || u.email}</option>
          ))}
        </select>
        <button type="submit" className="h-9 rounded-md bg-gray-900 px-4 text-sm text-white">Filter</button>
        {(module || user) && (
          <Link href="/admin/logs" className="text-sm text-blue-600 hover:underline">Clear</Link>
        )}
        <span className="ml-auto text-sm text-gray-500">{total} entr{total === 1 ? "y" : "ies"}</span>
      </form>

      <Card>
        <CardContent className="p-0">
          <ActivityTable
            logs={logs.map((log) => ({
              id: log.id,
              dateLabel: timeFormat.format(log.createdAt),
              userLabel: log.user?.name || log.user?.email || "System",
              action: log.action,
              module: log.module,
            }))}
            canRemove={canRemove}
            total={total}
            filters={{ module, user }}
          />
        </CardContent>
      </Card>

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-6 text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="text-blue-600 hover:underline">← Newer</Link> : <span />}
          <span className="text-gray-500">Page {page} of {pageCount}</span>
          {page < pageCount ? <Link href={href(page + 1)} className="text-blue-600 hover:underline">Older →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
