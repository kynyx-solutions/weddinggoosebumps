"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DEFAULT_CONTACT_ADDRESS,
  DEFAULT_WHATSAPP_EVENT_MESSAGE,
  DEFAULT_WHATSAPP_MESSAGE,
  DEFAULT_WHATSAPP_NUMBER,
  whatsappLink,
} from "@/lib/whatsapp";

interface ContactForm {
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappEventMessage: string;
  contactAddress: string;
  mapUrl: string;
  showMap: boolean;
}

const textareaClass =
  "flex min-h-[90px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none";

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-gray-500">{children}</p>;
}

export default function SiteSettings() {
  const [form, setForm] = useState<ContactForm | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/settings/contact")
      .then((res): Promise<Partial<Record<keyof ContactForm, any>>> => (res.ok ? res.json() : Promise.resolve({})))
      .then((data) =>
        setForm({
          whatsappNumber: data.whatsappNumber ? `+${data.whatsappNumber}` : `+${DEFAULT_WHATSAPP_NUMBER}`,
          whatsappMessage: data.whatsappMessage || DEFAULT_WHATSAPP_MESSAGE,
          whatsappEventMessage: data.whatsappEventMessage || DEFAULT_WHATSAPP_EVENT_MESSAGE,
          contactAddress: data.contactAddress || DEFAULT_CONTACT_ADDRESS,
          mapUrl: data.mapUrl || "",
          showMap: data.showMap ?? true,
        })
      );
  }, []);

  if (!form) return <div>Loading...</div>;

  const update = (changes: Partial<ContactForm>) => {
    setForm({ ...form, ...changes });
    setNotice(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setNotice(null);

    try {
      const res = await fetch("/api/settings/contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't save the settings");
      setNotice({ ok: true, text: "Saved. The website shows the changes straight away." });
    } catch (error) {
      setNotice({ ok: false, text: error instanceof Error ? error.message : "Couldn't save the settings" });
    } finally {
      setIsSaving(false);
    }
  };

  const digits = form.whatsappNumber.replace(/\D/g, "") || DEFAULT_WHATSAPP_NUMBER;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Site Settings</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>WhatsApp button</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              The gold button in the bottom-right corner of every page opens a WhatsApp chat
              with this number, with the message below already typed in. Visitors still tap
              Send themselves.
            </p>
            <div className="space-y-2">
              <Label htmlFor="whatsappNumber">WhatsApp number</Label>
              <Input
                id="whatsappNumber"
                value={form.whatsappNumber}
                placeholder="+91 70047 34213"
                onChange={(e) => update({ whatsappNumber: e.target.value })}
              />
              <Hint>Include the country code, e.g. +91 70047 34213.</Hint>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">Message on most pages</Label>
              <textarea
                id="whatsappMessage"
                className={textareaClass}
                value={form.whatsappMessage}
                onChange={(e) => update({ whatsappMessage: e.target.value })}
              />
              <a
                href={whatsappLink(digits, form.whatsappMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                Try this message in WhatsApp →
              </a>
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsappEventMessage">Message on event pages</Label>
              <textarea
                id="whatsappEventMessage"
                className={textareaClass}
                value={form.whatsappEventMessage}
                onChange={(e) => update({ whatsappEventMessage: e.target.value })}
              />
              <Hint>{"{event}"} is replaced with the name of the event the visitor is looking at.</Hint>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Address on the Inquire page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contactAddress">Studio address</Label>
              <textarea
                id="contactAddress"
                className={textareaClass}
                value={form.contactAddress}
                placeholder={"Street and building\nCity, State PIN"}
                onChange={(e) => update({ contactAddress: e.target.value })}
              />
              <Hint>
                Shown in a &quot;Visit Us&quot; block under the phone and email on the Inquire page,
                and given to Google. Press Enter to start a new line.
              </Hint>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapUrl">Google Maps link (optional)</Label>
              <Input
                id="mapUrl"
                value={form.mapUrl}
                placeholder="https://maps.app.goo.gl/..."
                onChange={(e) => update({ mapUrl: e.target.value })}
              />
              <Hint>
                Paste the Share link of your Google Maps listing so &quot;Get directions&quot; opens
                exactly your studio. Left empty, it searches for the address.
              </Hint>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.showMap}
                onChange={(e) => update({ showMap: e.target.checked })}
                className="h-4 w-4"
              />
              Show a map under the address
            </label>
          </CardContent>
        </Card>

        {notice && (
          <p className={`text-sm ${notice.ok ? "text-green-700" : "text-red-600"}`}>{notice.text}</p>
        )}
        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </form>
    </div>
  );
}
