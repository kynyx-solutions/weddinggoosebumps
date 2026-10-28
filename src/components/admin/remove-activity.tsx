"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { toast } from "@/components/admin/toast";

export const activityEntries = (n: number) => `${n} entr${n === 1 ? "y" : "ies"}`;

// Removes activity-log entries through /api/activity (Super Admin only, checked there too) after a
// confirmation. `body` is { ids: [...] } or { all: true, module?, user? }. True when it worked.
export async function removeActivity(body: Record<string, unknown>, question: string) {
  if (!confirm(`${question} This can't be undone.`)) return false;
  try {
    const res = await fetch("/api/activity", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message);
    toast(`Removed ${activityEntries(data.removed ?? 0)} from the activity log`);
    return true;
  } catch (error) {
    toast(error instanceof Error && error.message ? error.message : "That didn't work, please try again");
    return false;
  }
}

// The bin icon on one activity entry
export function RemoveActivityButton({
  id,
  action,
  disabled,
  onRemoved,
}: {
  id: string;
  action: string;
  disabled?: boolean;
  onRemoved?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={disabled || busy}
      title="Remove this entry"
      aria-label={`Remove "${action}" from the activity log`}
      onClick={async () => {
        setBusy(true);
        if (await removeActivity({ ids: [id] }, "Remove this entry from the activity log?")) {
          onRemoved?.();
          router.refresh();
        }
        setBusy(false);
      }}
      className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
