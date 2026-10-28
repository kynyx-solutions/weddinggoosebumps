import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { OPEN_LEAD_STATUSES } from "@/lib/leads";
import { canSeeLeads } from "@/lib/permissions";
import { Card, CardContent } from "@/components/ui/card";
import LeadsTable from "./LeadsTable";

// Fixed locale and time zone so dates read the same wherever the server runs
const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
const receivedFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});
// en-CA writes dates as YYYY-MM-DD, which sorts as text and fits <input type="date">
const indiaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" });

export default async function LeadsList({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  await requireAdmin(canSeeLeads);
  const { lead: initialLeadId } = await searchParams;
  const [leads, users] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" }
    }),
    prisma.user.findMany({
      select: { name: true, email: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);
  const today = indiaDay.format(new Date());

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads Inbox</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <LeadsTable
            initialLeadId={initialLeadId}
            team={users
              .filter((user) => user.email)
              .map((user) => ({ value: user.email!, label: user.name || user.email! }))}
            leads={leads.map((lead) => {
              const followUpDate = lead.followUpAt ? indiaDay.format(lead.followUpAt) : null;
              return {
                id: lead.id,
                name: lead.name,
                email: lead.email,
                phone: lead.phone,
                message: lead.message,
                status: lead.status,
                sourcePage: lead.sourcePage,
                utmSource: lead.utmSource,
                utmMedium: lead.utmMedium,
                utmCampaign: lead.utmCampaign,
                notes: lead.notes,
                assignedTo: lead.assignedTo,
                followUpDate,
                followUpLabel: lead.followUpAt ? dateFormat.format(lead.followUpAt) : null,
                followUpDue:
                  followUpDate !== null &&
                  followUpDate <= today &&
                  OPEN_LEAD_STATUSES.includes(lead.status),
                version: lead.updatedAt.toISOString(),
                dateLabel: dateFormat.format(lead.createdAt),
                receivedLabel: receivedFormat.format(lead.createdAt),
              };
            })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
