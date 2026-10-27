import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import LeadsTable from "./LeadsTable";

// Fixed locale and time zone so dates read the same wherever the server runs
const dateFormat = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
const receivedFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function LeadsList({
  searchParams,
}: {
  searchParams: Promise<{ lead?: string }>;
}) {
  await requireAdmin();
  const { lead: initialLeadId } = await searchParams;
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads Inbox</h1>
      </div>

      <Card>
        <CardContent className="p-0">
          <LeadsTable
            initialLeadId={initialLeadId}
            leads={leads.map((lead) => ({
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
              dateLabel: dateFormat.format(lead.createdAt),
              receivedLabel: receivedFormat.format(lead.createdAt),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
