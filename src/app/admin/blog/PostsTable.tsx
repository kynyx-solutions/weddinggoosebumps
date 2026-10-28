"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Copy, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { toast } from "@/components/admin/toast";
interface PostRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  dateLabel: string;
  updatedLabel: string;
  trashedLabel: string | null;
  destination: string | null;
  categories: string[];
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-amber-100 text-amber-800",
  draft: "bg-gray-100 text-gray-800",
};

const selectClass =
  "h-9 rounded-md border border-slate-200 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none";

export default function PostsTable({
  posts,
  trash,
  activeCount,
  trashCount,
}: {
  posts: PostRow[];
  trash: boolean;
  activeCount: number;
  trashCount: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const visible = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean);
    return posts.filter((post) => {
      if (status !== "All" && post.status.toLowerCase() !== status.toLowerCase()) return false;
      const haystack = [post.title, post.slug, post.destination, ...post.categories].join(" ").toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  }, [posts, query, status]);

  const allChecked = visible.length > 0 && visible.every((post) => selected.includes(post.id));

  const bulk = async (action: string, confirmText?: string) => {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/blog/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected, action }),
      });
      if (!res.ok) throw new Error();
      setSelected([]);
      router.refresh();
    } catch {
      toast("That didn't work, please try again");
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async (post: PostRow) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/blog/${post.id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error();
      const copy = await res.json();
      router.push(`/admin/blog/${copy.id}`);
    } catch {
      toast("Couldn't duplicate the post");
      setBusy(false);
    }
  };

  const viewLink = (target: boolean, label: string, count: number) => (
    <Link
      href={target ? "/admin/blog?view=trash" : "/admin/blog"}
      className={`border-b-2 px-1 pb-2 text-sm font-medium ${
        trash === target ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500 hover:text-gray-800"
      }`}
    >
      {label} ({count})
    </Link>
  );

  return (
    <>
      <div className="flex gap-6 border-b px-4 pt-4">
        {viewLink(false, "All posts", activeCount)}
        {viewLink(true, "Trash", trashCount)}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b p-4">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search titles, destinations, categories" className="pl-9" />
        </div>
        {!trash && (
          <select className={selectClass} value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option>All</option>
            <option>Published</option>
            <option>Scheduled</option>
            <option>Draft</option>
          </select>
        )}
        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">{selected.length} selected</span>
            {trash ? (
              <>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => bulk("restore")}>Restore</Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={busy}
                  onClick={() => bulk("purge", "Delete the selected posts for good? This can't be undone.")}
                >
                  Delete for good
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => bulk("publish")}>Publish</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => bulk("draft")}>Back to draft</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => bulk("trash")}>Move to trash</Button>
              </>
            )}
          </div>
        )}
      </div>

      {trash && (
        <p className="border-b bg-amber-50 px-4 py-2 text-xs text-amber-800">
          Posts in the trash aren&apos;t on the website and are deleted for good after 30 days.
        </p>
      )}

      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="w-10 px-4 py-4">
              <input
                type="checkbox"
                className="h-4 w-4"
                aria-label="Select all"
                checked={allChecked}
                onChange={(e) => setSelected(e.target.checked ? visible.map((post) => post.id) : [])}
              />
            </th>
            <th className="px-4 py-4 font-medium text-gray-900">Title</th>
            <th className="px-4 py-4 font-medium text-gray-900">Status</th>
            <th className="px-4 py-4 font-medium text-gray-900">{trash ? "Trashed" : "Date"}</th>
            <th className="px-4 py-4 font-medium text-gray-900">Updated</th>
            <th className="px-4 py-4 font-medium text-gray-900 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {visible.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                {posts.length === 0 ? (trash ? "The trash is empty." : "No blog posts found.") : "No posts match."}
              </td>
            </tr>
          )}
          {visible.map((post) => (
            <tr key={post.id} className="hover:bg-gray-50">
              <td className="px-4 py-4">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  aria-label={`Select ${post.title}`}
                  checked={selected.includes(post.id)}
                  onChange={(e) =>
                    setSelected((current) =>
                      e.target.checked ? [...current, post.id] : current.filter((id) => id !== post.id)
                    )
                  }
                />
              </td>
              <td className="px-4 py-4">
                {trash ? (
                  <span className="text-gray-700">{post.title}</span>
                ) : (
                  <Link href={`/admin/blog/${post.id}`} className="font-medium text-gray-900 hover:underline">
                    {post.title}
                  </Link>
                )}
                {(post.destination || post.categories.length > 0) && (
                  <p className="mt-0.5 text-xs text-gray-500">
                    {[post.destination, ...post.categories].filter(Boolean).join(" · ")}
                  </p>
                )}
              </td>
              <td className="px-4 py-4">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    STATUS_STYLES[post.status.toLowerCase()] ?? "bg-gray-100 text-gray-800"
                  }`}
                >
                  {post.status}
                </span>
              </td>
              <td className="px-4 py-4 text-gray-500">{trash ? post.trashedLabel : post.dateLabel}</td>
              <td className="px-4 py-4 text-gray-500">{post.updatedLabel}</td>
              <td className="px-4 py-4 text-right whitespace-nowrap">
                {trash ? (
                  <span className="text-xs text-gray-400">Select to restore</span>
                ) : (
                  <>
                    <Link href={`/admin/blog/${post.id}`}>
                      <Button variant="outline" size="sm" className="mr-2">Edit</Button>
                    </Link>
                    <Link href={`/blog${post.slug.startsWith('/') ? post.slug : `/${post.slug}`}`} target="_blank">
                      <Button variant="secondary" size="sm" className="mr-2">Preview</Button>
                    </Link>
                    <Button variant="outline" size="sm" disabled={busy} onClick={() => duplicate(post)} title="Duplicate">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
