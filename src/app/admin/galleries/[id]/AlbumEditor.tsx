"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import MediaLibrary, { compressForUpload } from "@/components/media/MediaLibrary";
import SortableList from "@/components/admin/sortable-list";

import { toast } from "@/components/admin/toast";
interface Photo {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

interface Album {
  id: string;
  slug: string;
  heading: string;
  subheading: string;
  coverImage: string;
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

// The page lays photos out by their real proportions, so each one is measured before saving
async function measure(source: File | string) {
  if (typeof source !== "string") {
    const bitmap = await createImageBitmap(source);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  }
  const img = new Image();
  img.src = source;
  await img.decode();
  return { width: img.naturalWidth, height: img.naturalHeight };
}

export default function AlbumEditor({ album, initialPhotos }: { album: Album; initialPhotos: Photo[] }) {
  const [card, setCard] = useState(album);
  const [photos, setPhotos] = useState(initialPhotos);
  const [savingCard, setSavingCard] = useState(false);
  const [notice, setNotice] = useState("");
  const [progress, setProgress] = useState("");
  const [mediaFor, setMediaFor] = useState<"cover" | "photo" | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const saveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCard(true);
    setNotice("");
    try {
      await send(`/api/galleries/${album.id}`, "PUT", {
        heading: card.heading,
        subheading: card.subheading,
        coverImage: card.coverImage,
      });
      setNotice("Saved.");
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSavingCard(false);
    }
  };

  const addPhotos = async (items: { src: string; width: number; height: number; alt?: string }[]) => {
    const added = await send(`/api/galleries/${album.id}/photos`, "POST", { photos: items });
    setPhotos((current) => [...current, ...added.map((p: Photo) => ({ ...p, alt: p.alt ?? "" }))]);
  };

  const upload = async (files: FileList) => {
    const list = Array.from(files);
    const uploaded: { src: string; width: number; height: number }[] = [];
    try {
      for (const [index, original] of list.entries()) {
        setProgress(`Uploading ${index + 1} of ${list.length}...`);
        const file = await compressForUpload(original);
        const size = await measure(file);
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "gallery");
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) throw new Error(data.message || `Couldn't upload ${original.name}`);
        uploaded.push({ src: data.url, ...size });
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      // Whatever made it up is added, even if a later file failed
      if (uploaded.length) await addPhotos(uploaded).catch((err) => toast(err.message));
      setProgress("");
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const reorder = async (next: Photo[]) => {
    const previous = photos;
    setPhotos(next);
    try {
      await send("/api/galleries/reorder", "PUT", { galleryId: album.id, ids: next.map((p) => p.id) });
    } catch (err) {
      setPhotos(previous);
      toast(err instanceof Error ? err.message : "Couldn't save the order");
    }
  };

  const saveAlt = async (photo: Photo) => {
    try {
      await send(`/api/galleries/photos/${photo.id}`, "PUT", { alt: photo.alt });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't save the description");
    }
  };

  const removePhoto = async (photo: Photo) => {
    if (!confirm("Remove this photo from the album?")) return;
    try {
      await send(`/api/galleries/photos/${photo.id}`, "DELETE");
      setPhotos((current) => current.filter((p) => p.id !== photo.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't remove the photo");
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{card.heading || "Album"}</h1>
        <div className="flex gap-4 text-sm">
          <a href={`/galleries/${album.slug}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            View on the website
          </a>
          <Link href="/admin/galleries" className="text-blue-600 hover:underline">
            ← All albums
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Album card</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveCard} className="grid gap-6 md:grid-cols-[160px_1fr]">
            <div className="space-y-2">
              <img src={card.coverImage} alt="" className="aspect-[3/4] w-full rounded border object-cover" />
              <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => setMediaFor("cover")}>
                Change cover
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heading">Heading</Label>
                <Input id="heading" value={card.heading} onChange={(e) => setCard({ ...card, heading: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subheading">Couple</Label>
                <Input id="subheading" value={card.subheading} onChange={(e) => setCard({ ...card, subheading: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={savingCard}>{savingCard ? "Saving..." : "Save"}</Button>
                {notice && <p className="text-sm text-gray-600">{notice}</p>}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos ({photos.length})</CardTitle>
          <p className="text-sm text-gray-500">
            Drag to reorder. Descriptions are read by Google and screen readers; they save when you
            click away.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files?.length && upload(e.target.files)}
            />
            <Button type="button" onClick={() => fileInput.current?.click()} disabled={Boolean(progress)}>
              <Upload className="mr-2 h-4 w-4" />
              Upload photos
            </Button>
            <Button type="button" variant="outline" onClick={() => setMediaFor("photo")} disabled={Boolean(progress)}>
              Add from media library
            </Button>
            {progress && <p className="text-sm text-gray-600">{progress}</p>}
          </div>

          {photos.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">No photos yet.</p>
          ) : (
            <SortableList
              items={photos}
              onReorder={reorder}
              layout="grid"
              className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
              itemClassName="rounded-md border bg-white p-2"
            >
              {(photo, handle) => (
                <div className="space-y-2">
                  <img src={photo.src} alt={photo.alt} className="aspect-square w-full rounded object-cover" />
                  <div className="flex items-center gap-1">
                    {handle}
                    <Input
                      value={photo.alt}
                      placeholder="Description"
                      className="h-8 text-xs"
                      onChange={(e) =>
                        setPhotos((current) => current.map((p) => (p.id === photo.id ? { ...p, alt: e.target.value } : p)))
                      }
                      onBlur={() => saveAlt(photos.find((p) => p.id === photo.id) ?? photo)}
                    />
                    <button type="button" onClick={() => removePhoto(photo)} className="rounded p-1.5 text-red-500 hover:bg-red-50" title="Remove">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </SortableList>
          )}
        </CardContent>
      </Card>

      <MediaLibrary
        open={mediaFor !== null}
        folder="gallery"
        onClose={() => setMediaFor(null)}
        onSelect={async (url, alt) => {
          const target = mediaFor;
          setMediaFor(null);
          if (target === "cover") {
            setCard((current) => ({ ...current, coverImage: url }));
            return;
          }
          try {
            await addPhotos([{ src: url, alt, ...(await measure(url)) }]);
          } catch (err) {
            toast(err instanceof Error ? err.message : "Couldn't add the photo");
          }
        }}
      />
    </div>
  );
}
