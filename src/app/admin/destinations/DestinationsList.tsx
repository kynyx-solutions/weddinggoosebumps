"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import SortableList from "@/components/admin/sortable-list";

import { toast } from "@/components/admin/toast";
interface DestinationRow {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  heroImage: string | null;
  isHidden: boolean;
  postCount: number;
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Something went wrong, please try again");
  }
}

export default function DestinationsList({ initialItems }: { initialItems: DestinationRow[] }) {
  const [items, setItems] = useState(initialItems);

  const reorder = async (next: DestinationRow[]) => {
    const previous = items;
    setItems(next);
    try {
      await send("/api/destinations/reorder", "PUT", { ids: next.map((d) => d.id) });
    } catch (err) {
      setItems(previous);
      toast(err instanceof Error ? err.message : "Couldn't save the order");
    }
  };

  const toggle = async (item: DestinationRow) => {
    try {
      await send(`/api/destinations/${item.id}`, "PUT", { isHidden: !item.isHidden });
      setItems((current) => current.map((d) => (d.id === item.id ? { ...d, isHidden: !d.isHidden } : d)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update");
    }
  };

  const remove = async (item: DestinationRow) => {
    if (!confirm(`Delete "${item.name}"? Posts linked to it stay, just without the link.`)) return;
    try {
      await send(`/api/destinations/${item.id}`, "DELETE");
      setItems((current) => current.filter((d) => d.id !== item.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't delete");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Destinations</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            Each destination gets its own guide page at /destinations/&lt;name&gt;, and the first
            four appear in a &quot;Where we celebrate&quot; row on the home page. Nothing shows on
            the site until you add one.
          </p>
        </div>
        <Link href="/admin/destinations/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add destination
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-8 text-center text-gray-500">No destinations yet.</p>
          ) : (
            <SortableList items={items} onReorder={reorder} className="divide-y" itemClassName="flex items-center gap-3 bg-white px-4 py-3">
              {(item, handle) => (
                <>
                  {handle}
                  {item.heroImage ? (
                    <img src={item.heroImage} alt="" className="h-12 w-16 shrink-0 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-16 shrink-0 rounded bg-gray-100" />
                  )}
                  <div className={`min-w-0 flex-1 ${item.isHidden ? "opacity-50" : ""}`}>
                    <p className="truncate font-medium text-gray-900">{item.name}</p>
                    <p className="truncate text-sm text-gray-500">
                      {[item.region, `${item.postCount} post${item.postCount === 1 ? "" : "s"}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {item.isHidden && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Hidden</span>
                  )}
                  <a
                    href={`/destinations/${item.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded p-2 text-gray-500 hover:bg-gray-100"
                    title="View on the website"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => toggle(item)}
                    className="rounded p-2 text-gray-500 hover:bg-gray-100"
                    title={item.isHidden ? "Show on the website" : "Hide from the website"}
                  >
                    {item.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Link href={`/admin/destinations/${item.id}`} className="rounded p-2 text-gray-500 hover:bg-gray-100" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(item)}
                    className="rounded p-2 text-red-500 hover:bg-red-50"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </SortableList>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
