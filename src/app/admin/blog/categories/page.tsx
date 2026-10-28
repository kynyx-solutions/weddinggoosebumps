"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Term {
  id: string;
  name: string;
  slug: string;
  _count: { posts: number };
}

type TermType = "category" | "tag";

function TermList({
  type,
  title,
  hint,
  terms,
  onChanged,
}: {
  type: TermType;
  title: string;
  hint: string;
  terms: Term[];
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  const call = async (url: string, method: string, body?: unknown) => {
    setError("");
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message || "Something went wrong");
      return false;
    }
    onChanged();
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-gray-500">{hint}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (await call("/api/taxonomy", "POST", { type, name })) setName("");
          }}
        >
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={`New ${type}`} />
          <Button type="submit" disabled={!name.trim()}>Add</Button>
        </form>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {terms.length === 0 ? (
          <p className="text-sm text-gray-500">None yet.</p>
        ) : (
          <ul className="divide-y rounded-md border">
            {terms.map((term) => (
              <li key={term.id} className="flex items-center gap-2 px-3 py-2">
                {editing === term.id ? (
                  <form
                    className="flex flex-1 gap-2"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (await call(`/api/taxonomy/${type}/${term.id}`, "PUT", { name: editName })) setEditing(null);
                    }}
                  >
                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} autoFocus />
                    <Button type="submit" size="sm">Save</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                  </form>
                ) : (
                  <>
                    <span className="flex-1 text-sm">
                      {term.name}
                      <span className="ml-2 text-xs text-gray-500">
                        {term._count.posts} post{term._count.posts === 1 ? "" : "s"}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100"
                      title="Rename"
                      onClick={() => {
                        setEditing(term.id);
                        setEditName(term.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      className="rounded p-1.5 text-red-500 hover:bg-red-50"
                      title="Delete"
                      onClick={() => {
                        if (confirm(`Delete "${term.name}"? Posts keep existing, just without it.`)) {
                          call(`/api/taxonomy/${type}/${term.id}`, "DELETE");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function CategoriesPage() {
  const [data, setData] = useState<{ categories: Term[]; tags: Term[] } | null>(null);

  const load = () =>
    fetch("/api/taxonomy")
      .then((res) => res.json())
      .then(setData)
      .catch(() => setData({ categories: [], tags: [] }));

  useEffect(() => {
    load();
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Categories &amp; Tags</h1>
        <p className="max-w-2xl text-sm text-gray-600">
          Categories are the few broad groups visitors can filter the Journal by (for example
          Destination Weddings, Pre-Wedding Shoots). Tags are free-form keywords; you can also
          create them while writing a post.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <TermList type="category" title="Categories" hint="Tick them in a post's Post Details." terms={data.categories} onChanged={load} />
        <TermList type="tag" title="Tags" hint="Typed into a post's Tags field." terms={data.tags} onChanged={load} />
      </div>
    </div>
  );
}
