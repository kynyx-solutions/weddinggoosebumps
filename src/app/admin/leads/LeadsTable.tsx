"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  // Formatted on the server so server and browser render the same text
  dateLabel: string;
  receivedLabel: string;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      status === 'New' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
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

export default function LeadsTable({
  leads,
  initialLeadId,
}: {
  leads: LeadRow[];
  initialLeadId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialLeadId ?? null);
  const selected = leads.find((lead) => lead.id === selectedId) ?? null;

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
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-4 font-medium text-gray-900">Date</th>
            <th className="px-6 py-4 font-medium text-gray-900">Name</th>
            <th className="px-6 py-4 font-medium text-gray-900">Email</th>
            <th className="px-6 py-4 font-medium text-gray-900">Status</th>
            <th className="px-6 py-4 font-medium text-gray-900">Source</th>
            <th className="px-6 py-4">
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {leads.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                No leads found.
              </td>
            </tr>
          )}
          {leads.map((lead) => (
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
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle>{selected.name}</DialogTitle>
              <DialogDescription>Received {selected.receivedLabel}</DialogDescription>
            </DialogHeader>

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
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
