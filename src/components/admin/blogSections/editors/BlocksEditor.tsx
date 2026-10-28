"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import MediaLibrary from "@/components/media/MediaLibrary";
import SortableList from "@/components/admin/sortable-list";
import { saveBlogSection, useSectionSave } from "@/components/admin/post-save";
import { BLOCK_TYPES, newBlock, videoEmbedUrl, type Block, type BlockType } from "@/lib/blocks";

import { toast } from "@/components/admin/toast";
const areaClass =
  "flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none";

// Rows of two text boxes (facts, questions) with add/remove
function PairRows<T extends Record<string, string>>({
  rows,
  keys,
  placeholders,
  multiline,
  addLabel,
  onChange,
}: {
  rows: T[];
  keys: [keyof T & string, keyof T & string];
  placeholders: [string, string];
  multiline?: boolean;
  addLabel: string;
  onChange: (rows: T[]) => void;
}) {
  const set = (index: number, key: string, value: string) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  return (
    <div className="space-y-2">
      {rows.map((row, index) => (
        <div key={index} className={`flex gap-2 ${multiline ? "flex-col rounded-md border p-2" : ""}`}>
          <Input value={row[keys[0]]} placeholder={placeholders[0]} onChange={(e) => set(index, keys[0], e.target.value)} />
          {multiline ? (
            <textarea rows={3} className={areaClass} value={row[keys[1]]} placeholder={placeholders[1]} onChange={(e) => set(index, keys[1], e.target.value)} />
          ) : (
            <Input value={row[keys[1]]} placeholder={placeholders[1]} onChange={(e) => set(index, keys[1], e.target.value)} />
          )}
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, i) => i !== index))}
            className="self-end rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500"
            aria-label="Remove row"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, { [keys[0]]: "", [keys[1]]: "" } as T])}
      >
        <Plus className="mr-1 h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

function BlockFields({
  block,
  onChange,
  onPickImage,
}: {
  block: Block;
  onChange: (block: Block) => void;
  onPickImage: () => void;
}) {
  switch (block.type) {
    case "gallery":
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {block.images.map((image, index) => (
              <div key={image.src + index} className="space-y-1">
                <div className="relative">
                  <img src={image.src} alt="" className="aspect-[3/4] w-full rounded object-cover" />
                  <button
                    type="button"
                    onClick={() => onChange({ ...block, images: block.images.filter((_, i) => i !== index) })}
                    className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-red-500"
                    aria-label="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Input
                  value={image.alt}
                  placeholder="What the photo shows"
                  onChange={(e) =>
                    onChange({
                      ...block,
                      images: block.images.map((img, i) => (i === index ? { ...img, alt: e.target.value } : img)),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onPickImage}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add photo
          </Button>
        </div>
      );
    case "film":
      return (
        <div className="space-y-2">
          <Input value={block.url} placeholder="YouTube or Vimeo link" onChange={(e) => onChange({ ...block, url: e.target.value })} />
          {block.url && !videoEmbedUrl(block.url) && (
            <p className="text-xs text-red-600">That doesn&apos;t look like a YouTube or Vimeo link.</p>
          )}
          <Input value={block.caption} placeholder="Caption (optional)" onChange={(e) => onChange({ ...block, caption: e.target.value })} />
        </div>
      );
    case "facts":
      return (
        <PairRows
          rows={block.items}
          keys={["label", "value"]}
          placeholders={["Label, e.g. Guests", "Value, e.g. 350"]}
          addLabel="Add fact"
          onChange={(items) => onChange({ ...block, items })}
        />
      );
    case "quote":
      return (
        <div className="space-y-2">
          <textarea rows={3} className={areaClass} value={block.text} placeholder="The quote" onChange={(e) => onChange({ ...block, text: e.target.value })} />
          <Input value={block.author} placeholder="Who said it, e.g. Tanya & Aayush" onChange={(e) => onChange({ ...block, author: e.target.value })} />
        </div>
      );
    case "button":
      return (
        <div className="grid gap-2 sm:grid-cols-2">
          <Input value={block.label} placeholder="Button text" onChange={(e) => onChange({ ...block, label: e.target.value })} />
          <Input value={block.href} placeholder="/inquire or https://..." onChange={(e) => onChange({ ...block, href: e.target.value })} />
        </div>
      );
    case "faq":
      return (
        <PairRows
          rows={block.items}
          keys={["question", "answer"]}
          placeholders={["Question", "Answer"]}
          multiline
          addLabel="Add question"
          onChange={(items) => onChange({ ...block, items })}
        />
      );
  }
}

export default function BlocksEditor({ blogId }: { blogId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  const save = useSectionSave("blocks", { blocks }, loaded, (content, autosave) =>
    saveBlogSection(blogId, "blocks", content, autosave)
  );

  useEffect(() => {
    fetch(`/api/blog-sections?blogId=${blogId}&section=blocks`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data?.content?.blocks)) setBlocks(data.data.content.blocks);
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, [blogId]);

  const update = (block: Block) => setBlocks((current) => current.map((b) => (b.id === block.id ? block : b)));
  const add = (type: BlockType) => setBlocks((current) => [...current, newBlock(type)]);

  const saveNow = async () => {
    try {
      setSaving(true);
      await save({ force: true });
      toast("Blocks saved");
    } catch (error) {
      console.error(error);
      toast("Failed to save the blocks.");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="p-6">Loading...</div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Extra blocks</CardTitle>
          <p className="text-sm text-gray-500">
            Optional. Shown on the post page after the Story, in this order. Drag to reorder. Empty
            blocks are left off the page.
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          {blocks.length > 0 && (
            <SortableList items={blocks} onReorder={setBlocks} className="space-y-4" itemClassName="rounded-lg border bg-white p-4">
              {(block, handle) => (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    {handle}
                    <p className="flex-1 text-sm font-medium">
                      {BLOCK_TYPES.find((t) => t.type === block.type)?.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => setBlocks((current) => current.filter((b) => b.id !== block.id))}
                      className="rounded p-2 text-red-500 hover:bg-red-50"
                      aria-label="Delete block"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <BlockFields block={block} onChange={update} onPickImage={() => setPickingFor(block.id)} />
                </div>
              )}
            </SortableList>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">Add a block</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BLOCK_TYPES.map((type) => (
                <button
                  key={type.type}
                  type="button"
                  onClick={() => add(type.type)}
                  className="rounded-md border bg-white px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  <span className="block font-medium">{type.label}</span>
                  <span className="block text-xs text-gray-500">{type.hint}</span>
                </button>
              ))}
            </div>
          </div>

          <Button type="button" onClick={saveNow} disabled={saving} className="w-full bg-yellow-500 text-white hover:bg-yellow-600">
            {saving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <MediaLibrary
        open={pickingFor !== null}
        folder="blog"
        onClose={() => setPickingFor(null)}
        onSelect={(url, alt) => {
          setBlocks((current) =>
            current.map((b) =>
              b.id === pickingFor && b.type === "gallery" ? { ...b, images: [...b.images, { src: url, alt: alt ?? "" }] } : b
            )
          );
          setPickingFor(null);
        }}
      />
    </>
  );
}
