"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { toast } from "@/components/admin/toast";
interface RedirectRow {
  id: string;
  source: string;
  destination: string;
  permanent: boolean;
}

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<RedirectRow[] | null>(null);
  const [form, setForm] = useState({ source: "", destination: "", permanent: true });
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/redirects")
      .then((res) => (res.ok ? res.json() : []))
      .then(setRedirects)
      .catch(() => setRedirects([]));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message || "Couldn't add the redirect");
      return;
    }
    setRedirects((current) => [data, ...(current ?? [])]);
    setForm({ source: "", destination: "", permanent: true });
  };

  const remove = async (redirect: RedirectRow) => {
    if (!confirm(`Stop redirecting ${redirect.source}?`)) return;
    const res = await fetch(`/api/redirects/${redirect.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast(data.message || "Couldn't remove the redirect");
      return;
    }
    setRedirects((current) => (current ?? []).filter((r) => r.id !== redirect.id));
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Redirects</h1>
        <p className="max-w-2xl text-sm text-gray-600">
          Send visitors (and Google) from an old address to a new one, for example after renaming a
          post or when an old link is still shared on Instagram. New redirects work within a minute.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add a redirect</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={add} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <Input value={form.source} placeholder="Old address, e.g. /old-wedding" onChange={(e) => setForm({ ...form, source: e.target.value })} />
            <Input value={form.destination} placeholder="New address, e.g. /events/new-wedding" onChange={(e) => setForm({ ...form, destination: e.target.value })} />
            <Button type="submit" disabled={!form.source || !form.destination}>Add</Button>
            <label className="flex items-center gap-2 text-sm text-gray-700 md:col-span-3">
              <input type="checkbox" className="h-4 w-4" checked={form.permanent} onChange={(e) => setForm({ ...form, permanent: e.target.checked })} />
              Permanent (tells Google the page has moved for good; untick for a temporary redirect)
            </label>
          </form>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {redirects === null ? (
            <p className="p-6 text-sm text-gray-500">Loading...</p>
          ) : redirects.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No redirects yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-6 py-4 font-medium text-gray-900">From</th>
                  <th className="px-6 py-4 font-medium text-gray-900">To</th>
                  <th className="px-6 py-4 font-medium text-gray-900">Type</th>
                  <th className="px-6 py-4"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {redirects.map((redirect) => (
                  <tr key={redirect.id}>
                    <td className="px-6 py-4 font-mono text-xs text-gray-900">{redirect.source}</td>
                    <td className="px-6 py-4 font-mono text-xs break-all text-gray-600">{redirect.destination}</td>
                    <td className="px-6 py-4 text-gray-500">{redirect.permanent ? "Permanent (301)" : "Temporary (302)"}</td>
                    <td className="px-6 py-4 text-right">
                      <button type="button" onClick={() => remove(redirect)} className="rounded p-2 text-red-500 hover:bg-red-50" title="Remove">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
