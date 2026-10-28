"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Mail, MessageCircle, Phone, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LEAD_STATUSES } from "@/lib/leads";

export interface LeadRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  sourcePage: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  notes: string | null;
  assignedTo: string | null;
  // YYYY-MM-DD in India time, for the date picker
  followUpDate: string | null;
  followUpLabel: string | null;
  followUpDue: boolean;
  // Changes on every save, so the popup's form resets to the saved values
  version: string;
  // Formatted on the server so server and browser render the same text
  dateLabel: string;
  receivedLabel: string;
}

interface TeamMember {
  value: string;
  label: string;
}

const STATUS_STYLES: Record<string, string> = {
  New: "bg-blue-100 text-blue-800",
  Contacted: "bg-amber-100 text-amber-800",
  Qualified: "bg-emerald-100 text-emerald-800",
  Closed: "bg-gray-100 text-gray-800",
  Spam: "bg-red-100 text-red-700",
};

const selectClass =
  "h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none";

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-800'
    }`}>
      {status}
    </span>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="min-w-0 text-gray-900">{children}</dd>
    </div>
  );
}

// wa.me needs the country code; 10-digit numbers typed in the form are Indian
function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, "");
}

// A leading = + - @ would make Excel run the cell as a formula
function csvCell(value: string | null) {
  const text = value ?? "";
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function downloadCsv(rows: LeadRow[], team: TeamMember[]) {
  const header = [
    "Received", "Name", "Email", "Phone", "Status", "Assigned to", "Follow-up",
    "Source page", "UTM source", "UTM medium", "UTM campaign", "Message", "Notes",
  ];
  const lines = rows.map((lead) =>
    [
      lead.receivedLabel,
      lead.name,
      lead.email,
      lead.phone,
      lead.status,
      team.find((member) => member.value === lead.assignedTo)?.label ?? lead.assignedTo,
      lead.followUpLabel,
      lead.sourcePage,
      lead.utmSource,
      lead.utmMedium,
      lead.utmCampaign,
      lead.message,
      lead.notes,
    ]
      .map(csvCell)
      .join(",")
  );
  // The byte-order mark makes Excel read the file as UTF-8 (names with accents, ₹, emoji)
  const blob = new Blob(["﻿" + [header.map(csvCell).join(","), ...lines].join("\r\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function LeadEditor({ lead, team }: { lead: LeadRow; team: TeamMember[] }) {
  const router = useRouter();
  const [status, setStatus] = useState(lead.status);
  const [assignedTo, setAssignedTo] = useState(lead.assignedTo ?? "");
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    status !== lead.status ||
    assignedTo !== (lead.assignedTo ?? "") ||
    followUpDate !== (lead.followUpDate ?? "") ||
    notes !== (lead.notes ?? "");

  // Someone assigned earlier who's no longer a user still shows as an option
  const options =
    lead.assignedTo && !team.some((member) => member.value === lead.assignedTo)
      ? [...team, { value: lead.assignedTo, label: lead.assignedTo }]
      : team;

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, assignedTo, followUpDate, notes }),
      });
      if (!res.ok) throw new Error((await res.text()) || "Couldn't save");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-500">Status</span>
          <select className={`${selectClass} w-full`} value={status} onChange={(e) => setStatus(e.target.value)}>
            {LEAD_STATUSES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-500">Assigned to</span>
          <select className={`${selectClass} w-full`} value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Nobody</option>
            {options.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-gray-500">Follow up on</span>
          <input
            type="date"
            className={`${selectClass} w-full`}
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
          />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-gray-500">Notes</span>
        <textarea
          className="min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
          placeholder="Calls, quotes sent, what they're looking for..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="flex items-center justify-end gap-3">
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="button" onClick={save} disabled={!dirty || saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

export default function LeadsTable({
  leads,
  team,
  initialLeadId,
}: {
  leads: LeadRow[];
  team: TeamMember[];
  initialLeadId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialLeadId ?? null);
  const selected = leads.find((lead) => lead.id === selectedId) ?? null;
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dueOnly, setDueOnly] = useState(false);

  const dueCount = leads.filter((lead) => lead.followUpDue).length;

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return leads.filter((lead) => {
      if (dueOnly && !lead.followUpDue) return false;
      if (statusFilter !== "All" && lead.status !== statusFilter) return false;
      const haystack = [lead.name, lead.email, lead.phone, lead.message, lead.notes]
        .join(" ")
        .toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [leads, query, statusFilter, dueOnly]);

  // ?lead=<id> makes each popup linkable; replaceState updates the URL without a refetch
  const openLead = (id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `?lead=${encodeURIComponent(id)}`);
  };

  const closeLead = () => {
    setSelectedId(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const campaign = selected
    ? [selected.utmSource, selected.utmMedium, selected.utmCampaign].filter(Boolean).join(" / ")
    : "";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, message or notes"
            className="pl-9"
          />
        </div>
        <select
          className={selectClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="All">All statuses</option>
          {LEAD_STATUSES.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setDueOnly(!dueOnly)}
          aria-pressed={dueOnly}
          className={`h-9 rounded-md border px-3 text-sm font-medium transition ${
            dueOnly
              ? "border-amber-500 bg-amber-50 text-amber-800"
              : "border-slate-200 bg-white text-gray-700 hover:bg-gray-50"
          }`}
        >
          Follow-ups due ({dueCount})
        </button>
        <Button type="button" variant="outline" onClick={() => downloadCsv(visible, team)} disabled={visible.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-4 font-medium text-gray-900">Date</th>
            <th className="px-6 py-4 font-medium text-gray-900">Name</th>
            <th className="px-6 py-4 font-medium text-gray-900">Email</th>
            <th className="px-6 py-4 font-medium text-gray-900">Status</th>
            <th className="px-6 py-4 font-medium text-gray-900">Follow-up</th>
            <th className="px-6 py-4 font-medium text-gray-900">Source</th>
            <th className="px-6 py-4">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {visible.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                {leads.length === 0 ? "No leads found." : "No leads match these filters."}
              </td>
            </tr>
          )}
          {visible.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => openLead(lead.id)}
              className="cursor-pointer hover:bg-gray-50"
            >
              <td className="px-6 py-4 text-gray-500">{lead.dateLabel}</td>
              <td className="px-6 py-4 font-medium text-gray-900">{lead.name}</td>
              <td className="px-6 py-4 text-gray-600">{lead.email}</td>
              <td className="px-6 py-4">
                <StatusBadge status={lead.status} />
              </td>
              <td className={`px-6 py-4 ${lead.followUpDue ? "font-medium text-amber-700" : "text-gray-500"}`}>
                {lead.followUpLabel ?? "-"}
              </td>
              <td className="px-6 py-4 text-gray-500">{lead.sourcePage || '-'}</td>
              <td className="px-6 py-4 text-right">
                {/* Keyboard route to the same popup the row click opens */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openLead(lead.id);
                  }}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog open={selected !== null} onOpenChange={(open) => !open && closeLead()}>
        {/* bg-white: the dialog's default bg-background colour isn't defined in this theme */}
        {selected && (
          <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
              <DialogDescription>Received {selected.receivedLabel}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-wrap gap-2">
              {selected.phone && (
                <>
                  <a
                    href={`https://wa.me/${whatsappNumber(selected.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-md border border-emerald-200 bg-emerald-50 px-3 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    WhatsApp
                  </a>
                  <a
                    href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`}
                    className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
                  >
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </>
              )}
              <a
                href={`mailto:${selected.email}`}
                className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                <Mail className="mr-2 h-4 w-4" />
                Email
              </a>
            </div>

            <dl className="space-y-3 text-sm">
              <Detail label="Email">
                <a href={`mailto:${selected.email}`} className="break-all text-blue-600 hover:underline">
                  {selected.email}
                </a>
              </Detail>
              <Detail label="Phone">
                {selected.phone ? (
                  <a
                    href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`}
                    className="text-blue-600 hover:underline"
                  >
                    {selected.phone}
                  </a>
                ) : (
                  <span className="text-gray-400">Not provided</span>
                )}
              </Detail>
              <Detail label="Status">
                <StatusBadge status={selected.status} />
              </Detail>
              <Detail label="Source page">{selected.sourcePage || '-'}</Detail>
              {campaign && <Detail label="Campaign">{campaign}</Detail>}

              <div>
                <dt className="font-medium text-gray-500">Message</dt>
                <dd className="mt-2 max-h-72 overflow-y-auto rounded-md border bg-gray-50 p-3 whitespace-pre-wrap break-words text-gray-800">
                  {selected.message || <span className="text-gray-400">No message</span>}
                </dd>
              </div>
            </dl>

            <LeadEditor key={`${selected.id}-${selected.version}`} lead={selected} team={team} />
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
