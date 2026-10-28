"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MediaLibrary from "@/components/media/MediaLibrary";
import { DESTINATION_REGIONS, type DestinationInput } from "@/lib/destination-fields";
import { slugify } from "@/lib/slug";

const fieldClass =
  "flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none";

const EMPTY: DestinationInput = {
  name: "",
  slug: "",
  region: "India",
  tagline: "",
  heroImage: "",
  intro: "",
  bestSeason: "",
  highlights: "",
  venues: "",
  metaTitle: "",
  metaDescription: "",
  isHidden: false,
};

function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export default function DestinationForm({ initial }: { initial: (DestinationInput & { id: string }) | null }) {
  const router = useRouter();
  const [form, setForm] = useState<DestinationInput>(initial ?? EMPTY);
  // A new destination's address follows its name until edited
  const [slugEdited, setSlugEdited] = useState(initial !== null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);

  const update = (changes: Partial<DestinationInput>) => {
    setForm((current) => ({ ...current, ...changes }));
    setNotice(null);
  };
  const slug = slugEdited ? slugify(form.slug) : slugify(form.name);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(initial ? `/api/destinations/${initial.id}` : "/api/destinations", {
        method: initial ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, slug }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Couldn't save");
      if (!initial) {
        router.replace(`/admin/destinations/${data.id}`);
        return;
      }
      update({ slug: data.slug });
      setNotice({ ok: true, text: "Saved. The website shows the changes straight away." });
    } catch (err) {
      setNotice({ ok: false, text: err instanceof Error ? err.message : "Couldn't save" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{initial ? `Edit ${initial.name}` : "New destination"}</h1>
        <Link href="/admin/destinations" className="text-sm text-blue-600 hover:underline">
          ← All destinations
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>The destination</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="name" label="Name">
            <Input id="name" value={form.name} placeholder="Udaipur" onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field id="slug" label="Page address" hint={slug ? `weddinggoosebumps.com/destinations/${slug}` : undefined}>
            <Input
              id="slug"
              value={slugEdited ? form.slug : slug}
              onChange={(e) => {
                setSlugEdited(true);
                update({ slug: e.target.value });
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="region" label="Region" hint="Destinations are grouped by region on the Destinations page.">
              <select id="region" className={`${fieldClass} h-10`} value={form.region} onChange={(e) => update({ region: e.target.value })}>
                {DESTINATION_REGIONS.map((region) => (
                  <option key={region}>{region}</option>
                ))}
              </select>
            </Field>
            <Field id="bestSeason" label="Best season">
              <Input id="bestSeason" value={form.bestSeason} placeholder="October to March" onChange={(e) => update({ bestSeason: e.target.value })} />
            </Field>
          </div>
          <Field id="tagline" label="Tagline" hint="One line under the name, e.g. The City of Lakes.">
            <Input id="tagline" value={form.tagline} onChange={(e) => update({ tagline: e.target.value })} />
          </Field>
          <Field id="hero" label="Main photo" hint="Landscape works best; it fills the top of the page.">
            {form.heroImage && <img src={form.heroImage} alt="" className="aspect-video w-full max-w-md rounded-md border object-cover" />}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setMediaOpen(true)}>
                {form.heroImage ? "Change photo" : "Choose photo"}
              </Button>
              {form.heroImage && (
                <Button type="button" variant="outline" onClick={() => update({ heroImage: "" })}>
                  Remove
                </Button>
              )}
            </div>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="intro" label="Introduction">
            <textarea id="intro" rows={7} className={fieldClass} value={form.intro} onChange={(e) => update({ intro: e.target.value })} />
          </Field>
          <Field id="highlights" label="Why celebrate here" hint="One point per line.">
            <textarea id="highlights" rows={5} className={fieldClass} value={form.highlights} onChange={(e) => update({ highlights: e.target.value })} />
          </Field>
          <Field id="venues" label="Venues we love" hint="One venue per line.">
            <textarea id="venues" rows={5} className={fieldClass} value={form.venues} onChange={(e) => update({ venues: e.target.value })} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Google</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="metaTitle" label="Title in Google" hint={`Left empty: "${form.name || "Udaipur"} Destination Weddings". ${form.metaTitle.length}/60 characters.`}>
            <Input id="metaTitle" value={form.metaTitle} onChange={(e) => update({ metaTitle: e.target.value })} />
          </Field>
          <Field id="metaDescription" label="Description in Google" hint={`Left empty: the tagline and introduction. ${form.metaDescription.length}/160 characters.`}>
            <textarea id="metaDescription" rows={3} className={fieldClass} value={form.metaDescription} onChange={(e) => update({ metaDescription: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="h-4 w-4" checked={form.isHidden} onChange={(e) => update({ isHidden: e.target.checked })} />
            Hide this destination from the website
          </label>
        </CardContent>
      </Card>

      {notice && <p className={`text-sm ${notice.ok ? "text-green-700" : "text-red-600"}`}>{notice.text}</p>}
      <div className="flex gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? "Saving..." : initial ? "Save" : "Create destination"}
        </Button>
        {initial && (
          <a href={`/destinations/${form.slug || slug}`} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline">View on the website</Button>
          </a>
        )}
      </div>

      <MediaLibrary
        open={mediaOpen}
        folder="pages"
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          update({ heroImage: url });
          setMediaOpen(false);
        }}
      />
    </form>
  );
}
