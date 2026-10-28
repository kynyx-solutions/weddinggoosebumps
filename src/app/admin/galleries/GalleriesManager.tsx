"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MediaLibrary from "@/components/media/MediaLibrary";
import SortableList from "@/components/admin/sortable-list";

import { toast } from "@/components/admin/toast";
interface AlbumRow {
  id: string;
  slug: string;
  heading: string;
  subheading: string | null;
  coverImage: string;
  isHidden: boolean;
  photoCount: number;
}

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = res.status === 204 ? null : await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || "Something went wrong, please try again");
  return data;
}

export default function GalleriesManager({
  initialAlbums,
  builtInCount,
}: {
  initialAlbums: AlbumRow[];
  builtInCount: number;
}) {
  const router = useRouter();
  const [albums, setAlbums] = useState(initialAlbums);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ heading: "", subheading: "", coverImage: "" });
  const [mediaOpen, setMediaOpen] = useState(false);
  const [error, setError] = useState("");

  const runImport = async () => {
    setImporting(true);
    try {
      await send("/api/galleries/import", "POST");
      router.refresh();
      window.location.reload();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Import failed");
      setImporting(false);
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const album = await send("/api/galleries", "POST", form);
      router.push(`/admin/galleries/${album.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create the album");
    }
  };

  const reorder = async (next: AlbumRow[]) => {
    const previous = albums;
    setAlbums(next);
    try {
      await send("/api/galleries/reorder", "PUT", { ids: next.map((a) => a.id) });
    } catch (err) {
      setAlbums(previous);
      toast(err instanceof Error ? err.message : "Couldn't save the order");
    }
  };

  const toggle = async (album: AlbumRow) => {
    try {
      await send(`/api/galleries/${album.id}`, "PUT", { isHidden: !album.isHidden });
      setAlbums((current) => current.map((a) => (a.id === album.id ? { ...a, isHidden: !a.isHidden } : a)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update");
    }
  };

  const remove = async (album: AlbumRow) => {
    if (!confirm(`Delete the album "${album.heading}"? Its photos stay in the media library.`)) return;
    try {
      await send(`/api/galleries/${album.id}`, "DELETE");
      setAlbums((current) => current.filter((a) => a.id !== album.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't delete");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Galleries</h1>
          <p className="max-w-2xl text-sm text-gray-600">
            The albums on the Galleries page. Drag to change their order; open one to add,
            reorder or describe its photos.
          </p>
        </div>
        {albums.length > 0 && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New album
          </Button>
        )}
      </div>

      {albums.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 p-6">
            <p className="text-sm text-gray-700">
              The Galleries page currently shows its {builtInCount} built-in albums. Import them to
              manage them here. The page looks exactly the same afterwards, at the same addresses.
            </p>
            <Button onClick={runImport} disabled={importing}>
              {importing ? "Importing..." : `Import the ${builtInCount} albums`}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <SortableList items={albums} onReorder={reorder} className="divide-y" itemClassName="flex items-center gap-3 bg-white px-4 py-3">
              {(album, handle) => (
                <>
                  {handle}
                  <img src={album.coverImage} alt="" className="h-16 w-12 shrink-0 rounded object-cover" />
                  <div className={`min-w-0 flex-1 ${album.isHidden ? "opacity-50" : ""}`}>
                    <p className="truncate font-medium text-gray-900">{album.heading}</p>
                    <p className="truncate text-sm text-gray-500">
                      {[album.subheading, `${album.photoCount} photo${album.photoCount === 1 ? "" : "s"}`]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  {album.isHidden && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Hidden</span>
                  )}
                  <a href={`/galleries/${album.slug}`} target="_blank" rel="noopener noreferrer" className="rounded p-2 text-gray-500 hover:bg-gray-100" title="View on the website">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button type="button" onClick={() => toggle(album)} className="rounded p-2 text-gray-500 hover:bg-gray-100" title={album.isHidden ? "Show on the website" : "Hide from the website"}>
                    {album.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <Link href={`/admin/galleries/${album.id}`} className="rounded p-2 text-gray-500 hover:bg-gray-100" title="Edit">
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button type="button" onClick={() => remove(album)} className="rounded p-2 text-red-500 hover:bg-red-50" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </SortableList>
          </CardContent>
        </Card>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        {/* bg-white: the dialog's default bg-background colour isn't defined in this theme */}
        <DialogContent className="bg-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New album</DialogTitle>
            <DialogDescription>You can add photos on the next screen.</DialogDescription>
          </DialogHeader>
          <form onSubmit={create} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heading">Heading</Label>
              <Input id="heading" value={form.heading} placeholder="Royal timeless luxury" onChange={(e) => setForm({ ...form, heading: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subheading">Couple</Label>
              <Input id="subheading" value={form.subheading} placeholder="Riya & Arjun" onChange={(e) => setForm({ ...form, subheading: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Cover photo</Label>
              {form.coverImage && <img src={form.coverImage} alt="" className="h-40 w-32 rounded border object-cover" />}
              <Button type="button" variant="outline" onClick={() => setMediaOpen(true)}>
                {form.coverImage ? "Change photo" : "Choose photo"}
              </Button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit">Create album</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MediaLibrary
        open={mediaOpen}
        folder="gallery"
        onClose={() => setMediaOpen(false)}
        onSelect={(url) => {
          setForm((current) => ({ ...current, coverImage: url }));
          setMediaOpen(false);
        }}
      />
    </div>
  );
}
