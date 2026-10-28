"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Eye, Monitor, Smartphone, Trash2 } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Youtube from "@tiptap/extension-youtube";
import EditorToolbar from "./EditorToolbar";
import MediaLibrary from "@/components/media/MediaLibrary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import BlogHeroEditor from "./blogSections/editors/BlogHeroEditor";
import ServiceEditor from "./blogSections/editors/ServiceEditor";
import KindwordsEditor from "./blogSections/editors/KindwordsEditor";
import SeoEditor from "./blogSections/editors/SeoEditor";
import BlogJournalEditor from "./blogSections/editors/BlogJournalEditor";
import BlocksEditor from "./blogSections/editors/BlocksEditor";
import { PostSaveProvider, usePostSaveRegistry } from "./post-save";
import { slugify } from "@/lib/slug";

import { toast } from "@/components/admin/toast";
const STATUSES = ["Draft", "Scheduled", "Published"];
const AUTOSAVE_INTERVAL_MS = 5000;
const AUTOSAVE_RETRY_MS = 30000;

// The date picker works in India time whatever time zone the computer is set to
const indiaParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function toIndiaInput(value: string | Date | null) {
  if (!value) return "";
  const parts = Object.fromEntries(
    indiaParts.formatToParts(new Date(value)).map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function fromIndiaInput(value: string) {
  return value ? new Date(`${value}:00+05:30`).toISOString() : null;
}

// Older posts may say "PUBLISHED"
function normalizeStatus(status: string) {
  return STATUSES.find((s) => s.toLowerCase() === String(status).toLowerCase()) ?? "Draft";
}

function timeAgo(at: number) {
  const minutes = Math.floor((Date.now() - at) / 60000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  return new Date(at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

interface PostFields {
  title: string;
  slug: string;
  status: string;
  publishDate: string;
  excerpt: string;
  coverImage: string;
  coverAlt: string;
  body: string;
  destinationId: string;
  categoryIds: string[];
  // As typed: comma-separated tag names
  tags: string;
}

interface Option {
  id: string;
  name: string;
}

interface RevisionItem {
  id: string;
  label: string | null;
  createdAt: string;
  by: string;
  changes: string[];
}

const revisionTime = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

export default function BlogEditor({
  initialPost,
  destinations,
  categories,
}: {
  initialPost: any;
  destinations: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const { registry, dirtyKeys, saveSections } = usePostSaveRegistry();

  const [initialFields] = useState<PostFields>(() => ({
    title: initialPost.title || "",
    slug: initialPost.slug || "",
    status: normalizeStatus(initialPost.status),
    publishDate: toIndiaInput(initialPost.publishDate),
    excerpt: initialPost.excerpt || "",
    coverImage: initialPost.coverImage || "",
    coverAlt: initialPost.coverAlt || "",
    body: initialPost.body || "",
    destinationId: initialPost.destinationId || "",
    categoryIds: (initialPost.categories ?? []).map((c: { categoryId: string }) => c.categoryId),
    tags: (initialPost.tags ?? []).map((t: { tag: { name: string } }) => t.tag.name).join(", "),
  }));
  const [fields, setFields] = useState(initialFields);
  // What the server has; edits are compared against it
  const [saved, setSaved] = useState(initialFields);
  const update = (changes: Partial<PostFields>) => setFields((current) => ({ ...current, ...changes }));

  const editor = useEditor({
    extensions: [
      StarterKit, // v3 already bundles Underline and Link
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Youtube.configure({ nocookie: true, modestBranding: true }),
    ],
    content: initialFields.body,
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      update({ body: editor.getHTML() });
    },
  });

  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [isDeleting, setIsDeleting] = useState(false);
  const [coverMediaOpen, setCoverMediaOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "phone">("desktop");
  const [previewKey, setPreviewKey] = useState(0);
  // Re-renders the "Saved 3 min ago" line
  const [, setTick] = useState(0);
  const [revisions, setRevisions] = useState<RevisionItem[]>([]);
  const [showAllRevisions, setShowAllRevisions] = useState(false);

  const loadRevisions = useCallback(() => {
    fetch(`/api/blog/${initialPost.id}/revisions`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setRevisions)
      .catch(() => {});
  }, [initialPost.id]);

  useEffect(loadRevisions, [loadRevisions]);

  const postDirty = JSON.stringify(fields) !== JSON.stringify(saved);
  const anyDirty = postDirty || dirtyKeys.size > 0;
  // Autosave only while the post stays a draft: a live post changes only when Save is pressed
  const canAutosave = saved.status === "Draft" && fields.status === "Draft";

  const fieldsRef = useRef(fields);
  fieldsRef.current = fields;
  const savingRef = useRef(false);
  const failedAtRef = useRef(0);

  const persist = useCallback(
    async (autosave: boolean) => {
      if (savingRef.current) return false;
      const snapshot = fieldsRef.current;
      if (snapshot.status === "Scheduled" && !snapshot.publishDate) {
        setSaveState({ kind: "error", message: "Pick the date and time this post should go live." });
        return false;
      }

      savingRef.current = true;
      setSaveState({ kind: "saving" });
      try {
        // Sections first, so a post being published goes live with its latest content
        await saveSections({ autosave });

        const res = await fetch(`/api/blog/${initialPost.id}${autosave ? "?autosave=1" : ""}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...snapshot,
            publishDate: fromIndiaInput(snapshot.publishDate),
            destinationId: snapshot.destinationId || null,
            tagNames: snapshot.tags.split(","),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Couldn't save the post.");

        // The server tidies a changed address ("My Post" → my-post)
        const stored = { ...snapshot, slug: data.slug ?? snapshot.slug, status: data.status ?? snapshot.status };
        setSaved(stored);
        setFields((current) => (current.slug === snapshot.slug ? { ...current, slug: stored.slug } : current));
        failedAtRef.current = 0;
        setSaveState({ kind: "saved", at: Date.now() });
        // Manual saves add a version to the history
        if (!autosave) loadRevisions();
        return true;
      } catch (error) {
        failedAtRef.current = Date.now();
        setSaveState({
          kind: "error",
          message: error instanceof Error ? error.message : "Couldn't save the post.",
        });
        return false;
      } finally {
        savingRef.current = false;
      }
    },
    [initialPost.id, saveSections, loadRevisions]
  );

  const autosaveRef = useRef({ dirty: anyDirty, allowed: canAutosave });
  autosaveRef.current = { dirty: anyDirty, allowed: canAutosave };

  useEffect(() => {
    const timer = setInterval(() => {
      const { dirty, allowed } = autosaveRef.current;
      if (!dirty || !allowed || savingRef.current) return;
      // After a failed save, wait before trying again rather than repeating the error
      if (Date.now() - failedAtRef.current < AUTOSAVE_RETRY_MS) return;
      persist(true);
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [persist]);

  useEffect(() => {
    const timer = setInterval(() => setTick((tick) => tick + 1), 15000);
    return () => clearInterval(timer);
  }, []);

  // Warn before leaving with unsaved changes: closing the tab, or clicking a link in the admin
  useEffect(() => {
    if (!anyDirty) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!link || link.target === "_blank") return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (!window.confirm("You have unsaved changes. Leave this page without saving them?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Capture on window runs before Next.js's own link handling, so a "Cancel" really stays
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("click", onClick, true);
    };
  }, [anyDirty]);

  const restoreRevision = async (revision: RevisionItem) => {
    const when = revisionTime.format(new Date(revision.createdAt));
    if (!confirm(`Restore the version from ${when}? The post as it is now is kept in the history, so you can switch back.`)) {
      return;
    }
    const res = await fetch(`/api/blog/${initialPost.id}/revisions/${revision.id}`, { method: "POST" });
    if (!res.ok) {
      toast("Could not restore that version");
      return;
    }
    // Reload so every tab shows the restored content
    window.location.reload();
  };

  const handleDelete = async () => {
    if (!confirm("Move this post to the trash? It disappears from the website, and you can restore it from the trash for 30 days.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/blog/${initialPost.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin/blog");
    } catch (err) {
      toast("Error deleting post");
      setIsDeleting(false);
    }
  };

  // A draft is saved first so the preview shows the latest edits
  const openPreview = async () => {
    if (anyDirty && canAutosave) await persist(true);
    setPreviewKey((key) => key + 1);
    setPreviewOpen(true);
  };

  const previewPath = `/events/${saved.slug.replace(/^\//, "")}`;
  const slugPreview = slugify(fields.slug);

  let statusLine: React.ReactNode;
  if (saveState.kind === "saving") {
    statusLine = "Saving...";
  } else if (saveState.kind === "error") {
    statusLine = <span className="text-red-600">{saveState.message}</span>;
  } else if (anyDirty) {
    statusLine = canAutosave
      ? "Unsaved changes · drafts save automatically every few seconds"
      : fields.status !== saved.status
        ? `Unsaved changes · press ${fields.status === "Draft" ? "Save" : fields.status === "Scheduled" ? "Schedule" : "Publish"} to apply`
        : "Unsaved changes · press Save to update the live post";
  } else if (saveState.kind === "saved") {
    statusLine = `All changes saved · ${timeAgo(saveState.at)}`;
  } else {
    statusLine = "All changes saved";
  }

  const saveLabel =
    fields.status === "Published" && saved.status !== "Published"
      ? "Publish"
      : fields.status === "Scheduled" && saved.status !== "Scheduled"
        ? "Schedule"
        : "Save Post";

  const triggerClass = `
  relative
  flex-none
  px-3
  py-3
  text-sm
  font-serif
  font-medium
  uppercase
  tracking-widest
  text-slate-400
  bg-transparent
  rounded-none
  shadow-none
  transition-colors
  duration-300

  hover:text-slate-700

  data-[state=active]:text-[#E74694]
  data-[state=active]:bg-transparent
  data-[state=active]:shadow-none

  after:block
  after:content-['']
  after:h-[2px]
  after:w-8
  after:mx-auto
  after:bg-[#E74694]
  after:mt-1
  after:scale-x-0
  after:transition-transform
  data-[state=active]:after:scale-x-100
`;
  // Every tab stays mounted (just hidden), so switching tabs never loses unsaved edits
  const tabContentClass = "data-[state=inactive]:hidden";

  return (
    <PostSaveProvider value={registry}>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      <div className="space-y-6 md:col-span-2">
        <Tabs defaultValue="hero" className="w-full">
          <TabsList className="mb-8 flex h-auto w-full flex-wrap justify-start gap-x-1 gap-y-1 rounded-none border-b border-slate-200 bg-transparent p-0">
            {" "}
            <TabsTrigger value="hero" className={triggerClass}>
              Hero
            </TabsTrigger>
            <TabsTrigger value="journal" className={triggerClass}>
              Journal
            </TabsTrigger>
            <TabsTrigger value="services" className={triggerClass}>
              Services
            </TabsTrigger>
            <TabsTrigger value="kindwords" className={triggerClass}>
              Kindwords
            </TabsTrigger>
            <TabsTrigger value="story" className={triggerClass}>
              Story
            </TabsTrigger>
            <TabsTrigger value="blocks" className={triggerClass}>
              Blocks
            </TabsTrigger>
            <TabsTrigger value="seo" className={triggerClass}>
              SEO
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hero" forceMount className={tabContentClass}>
            <BlogHeroEditor blogId={initialPost.id} initialTitle={fields.title} />
          </TabsContent>

          <TabsContent value="journal" forceMount className={tabContentClass}>
            <BlogJournalEditor blogId={initialPost.id} />
          </TabsContent>

          <TabsContent value="services" forceMount className={tabContentClass}>
            <ServiceEditor blogId={initialPost.id} />
          </TabsContent>

          <TabsContent value="kindwords" forceMount className={tabContentClass}>
            <KindwordsEditor blogId={initialPost.id} />
          </TabsContent>

          <TabsContent value="story" forceMount className={tabContentClass}>
            <Card>
              <CardHeader>
                <CardTitle>Story</CardTitle>
                <p className="text-sm text-gray-500">
                  Optional. Appears on the post page below the other sections: the full story,
                  more photos or a film. Leave it empty and the page looks as it does today.
                </p>
              </CardHeader>
              <CardContent>
                <EditorToolbar editor={editor} />
                <div className="rounded-md border bg-white">
                  <EditorContent editor={editor} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocks" forceMount className={tabContentClass}>
            <BlocksEditor blogId={initialPost.id} />
          </TabsContent>

          <TabsContent value="seo" forceMount className={tabContentClass}>
            <SeoEditor
              blogId={initialPost.id}
              post={{
                title: fields.title,
                slug: fields.slug,
                excerpt: fields.excerpt,
                coverImage: fields.coverImage,
                body: fields.body,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Publishing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
                value={fields.status}
                onChange={(e) => update({ status: e.target.value })}
              >
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Published">Published</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="publishDate">
                {fields.status === "Scheduled" ? "Goes live on (India time)" : "Post date (optional)"}
              </Label>
              <Input
                id="publishDate"
                type="datetime-local"
                value={fields.publishDate}
                onChange={(e) => update({ publishDate: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                {fields.status === "Scheduled"
                  ? "The post appears on the website by itself at this time."
                  : "The date shown on the post and its card. Leave empty to use the day it was created."}
              </p>
            </div>
            <Button
              onClick={() => persist(false)}
              disabled={saveState.kind === "saving" || isDeleting}
              className="w-full"
            >
              {saveState.kind === "saving" ? "Saving..." : saveLabel}
            </Button>
            <p className="text-xs text-gray-500" aria-live="polite">
              {statusLine}
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={openPreview}
              disabled={saveState.kind === "saving" || isDeleting}
              className="w-full"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              onClick={handleDelete}
              disabled={saveState.kind === "saving" || isDeleting}
              variant="destructive"
              className="mt-2 w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Move to trash
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Post Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={fields.title} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={fields.slug} onChange={(e) => update({ slug: e.target.value })} />
              {slugPreview && (
                <p className="text-xs break-all text-gray-500">weddinggoosebumps.com/events/{slugPreview}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="excerpt">Excerpt</Label>
              <textarea
                id="excerpt"
                rows={4}
                className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none"
                value={fields.excerpt}
                onChange={(e) => update({ excerpt: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                A sentence or two shown on the Events and Journal cards, and by Google when the
                SEO tab has no description. {fields.excerpt.length} characters.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Cover image</Label>
              {fields.coverImage && (
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md border bg-gray-50">
                  <img src={fields.coverImage} alt="" className="h-full w-full object-cover" />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setCoverMediaOpen(true)}>
                  {fields.coverImage ? "Change" : "Choose image"}
                </Button>
                {fields.coverImage && (
                  <Button type="button" variant="outline" onClick={() => update({ coverImage: "" })}>
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Used on the Journal cards and when the post is shared. Events cards use the Hero
                image.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="coverAlt">Cover image description</Label>
              <Input
                id="coverAlt"
                value={fields.coverAlt}
                placeholder="e.g. Bride and groom at the palace steps, Udaipur"
                onChange={(e) => update({ coverAlt: e.target.value })}
              />
              <p className="text-xs text-gray-500">Read by Google and screen readers. Falls back to the title.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destination</Label>
              <select
                id="destination"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm"
                value={fields.destinationId}
                onChange={(e) => update({ destinationId: e.target.value })}
              >
                <option value="">None</option>
                {destinations.map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500">
                The post appears on that destination&apos;s page. Add destinations under Site Content.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Categories</Label>
              {categories.length === 0 ? (
                <p className="text-xs text-gray-500">None yet. Add them under Events (Blog) → Categories &amp; Tags.</p>
              ) : (
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="h-4 w-4"
                        checked={fields.categoryIds.includes(category.id)}
                        onChange={(e) =>
                          update({
                            categoryIds: e.target.checked
                              ? [...fields.categoryIds, category.id]
                              : fields.categoryIds.filter((id) => id !== category.id),
                          })
                        }
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={fields.tags}
                placeholder="udaipur, palace wedding, sangeet"
                onChange={(e) => update({ tags: e.target.value })}
              />
              <p className="text-xs text-gray-500">Separate with commas. New tags are created when you save.</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {revisions.length === 0 ? (
              <p className="text-xs text-gray-500">
                Every time you press Save, a version is kept here so you can go back to it.
              </p>
            ) : (
              <ul className="space-y-3">
                {(showAllRevisions ? revisions : revisions.slice(0, 5)).map((revision, index) => (
                  <li key={revision.id} className="border-b pb-3 text-sm last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {revision.label ?? "Saved"} · {revisionTime.format(new Date(revision.createdAt))}
                        </p>
                        <p className="text-xs text-gray-500">by {revision.by}</p>
                      </div>
                      {index > 0 && (
                        <button
                          type="button"
                          onClick={() => restoreRevision(revision)}
                          className="shrink-0 text-xs font-medium text-blue-600 hover:underline"
                        >
                          Restore
                        </button>
                      )}
                    </div>
                    {revision.changes.length > 0 && (
                      <p className="mt-1 text-xs text-gray-600">Changed: {revision.changes.join(", ")}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {revisions.length > 5 && (
              <button
                type="button"
                onClick={() => setShowAllRevisions(!showAllRevisions)}
                className="text-xs font-medium text-blue-600 hover:underline"
              >
                {showAllRevisions ? "Show fewer" : `Show all ${revisions.length}`}
              </button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>

    <MediaLibrary
      open={coverMediaOpen}
      folder="blog"
      onClose={() => setCoverMediaOpen(false)}
      onSelect={(url, alt) => {
        update({ coverImage: url, ...(alt && !fields.coverAlt && { coverAlt: alt }) });
        setCoverMediaOpen(false);
      }}
    />

    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
      {/* bg-white: the dialog's default bg-background colour isn't defined in this theme */}
      <DialogContent className="flex h-[92vh] w-[96vw] max-w-[96vw] flex-col gap-3 bg-white p-4 sm:max-w-[96vw]">
        <DialogHeader className="flex-row flex-wrap items-center gap-3 space-y-0 pr-8">
          <DialogTitle className="mr-auto">Preview</DialogTitle>
          <DialogDescription className="sr-only">How the post looks on the website</DialogDescription>
          <div className="flex rounded-md border p-0.5">
            <button
              type="button"
              onClick={() => setPreviewDevice("desktop")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${previewDevice === "desktop" ? "bg-gray-900 text-white" : "text-gray-600"}`}
            >
              <Monitor className="h-4 w-4" /> Desktop
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice("phone")}
              className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm ${previewDevice === "phone" ? "bg-gray-900 text-white" : "text-gray-600"}`}
            >
              <Smartphone className="h-4 w-4" /> Phone
            </button>
          </div>
          <a
            href={previewPath}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
          >
            Open in new tab <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </DialogHeader>
        {anyDirty && !canAutosave && (
          <p className="text-sm text-amber-700">
            Showing the last saved version. Your unsaved changes appear here after you save.
          </p>
        )}
        <div className="flex min-h-0 flex-1 justify-center overflow-hidden rounded-md border bg-gray-100">
          <iframe
            key={previewKey}
            src={previewPath}
            title="Post preview"
            className={`h-full bg-white ${previewDevice === "phone" ? "w-[390px] border-x" : "w-full"}`}
          />
        </div>
      </DialogContent>
    </Dialog>
    </PostSaveProvider>
  );
}
