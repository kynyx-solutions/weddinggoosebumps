"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { activityEntries as entries, removeActivity, RemoveActivityButton } from "@/components/admin/remove-activity";

export interface ActivityRow {
  id: string;
  dateLabel: string;
  userLabel: string;
  action: string;
  module: string;
}

// The activity log table. A Super Admin (canRemove) can also remove entries: one at a time, the
// selected ones, or every entry matching the page's filters.
export default function ActivityTable({
  logs,
  canRemove,
  total,
  filters,
}: {
  logs: ActivityRow[];
  canRemove: boolean;
  total: number;
  filters: { module?: string; user?: string };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const filtered = Boolean(filters.module || filters.user);
  const allChecked = logs.length > 0 && logs.every((log) => selected.includes(log.id));

  const remove = async (body: Record<string, unknown>, question: string) => {
    setBusy(true);
    if (await removeActivity(body, question)) {
      setSelected([]);
      router.refresh();
    }
    setBusy(false);
  };

  return (
    <>
      {canRemove && total > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b p-4">
          {selected.length > 0 && (
            <>
              <span className="text-sm text-gray-600">{selected.length} selected</span>
              <Button
                size="sm"
                variant="destructive"
                disabled={busy}
                onClick={() =>
                  remove({ ids: selected }, `Remove the ${entries(selected.length)} you selected from the activity log?`)
                }
              >
                Remove selected
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            className="ml-auto"
            disabled={busy}
            onClick={() =>
              remove(
                { all: true, ...filters },
                filtered
                  ? `Remove all ${entries(total)} matching these filters from the activity log?`
                  : `Remove all ${entries(total)} from the activity log?`
              )
            }
          >
            {filtered ? `Remove all ${total} matching` : `Remove all ${total}`}
          </Button>
        </div>
      )}

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            {canRemove && (
              <th className="w-10 px-4 py-4">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  aria-label="Select all on this page"
                  checked={allChecked}
                  onChange={(e) => setSelected(e.target.checked ? logs.map((log) => log.id) : [])}
                />
              </th>
            )}
            <th className="px-6 py-4 font-medium text-gray-900">Date</th>
            <th className="px-6 py-4 font-medium text-gray-900">User</th>
            <th className="px-6 py-4 font-medium text-gray-900">Action</th>
            <th className="px-6 py-4 font-medium text-gray-900">Module</th>
            {canRemove && <th className="w-12 px-4 py-4"><span className="sr-only">Remove</span></th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {logs.length === 0 && (
            <tr>
              <td colSpan={canRemove ? 6 : 4} className="px-6 py-8 text-center text-gray-500">
                No activity logs found.
              </td>
            </tr>
          )}
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-gray-50">
              {canRemove && (
                <td className="px-4 py-4">
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    aria-label={`Select "${log.action}"`}
                    checked={selected.includes(log.id)}
                    onChange={(e) =>
                      setSelected((current) =>
                        e.target.checked ? [...current, log.id] : current.filter((id) => id !== log.id)
                      )
                    }
                  />
                </td>
              )}
              <td className="px-6 py-4 text-gray-500">{log.dateLabel}</td>
              <td className="px-6 py-4 font-medium text-gray-900">{log.userLabel}</td>
              <td className="px-6 py-4 font-medium text-gray-900">{log.action}</td>
              <td className="px-6 py-4 text-gray-500">{log.module}</td>
              {canRemove && (
                <td className="px-4 py-4 text-right">
                  <RemoveActivityButton
                    id={log.id}
                    action={log.action}
                    disabled={busy}
                    onRemoved={() => setSelected((current) => current.filter((id) => id !== log.id))}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
