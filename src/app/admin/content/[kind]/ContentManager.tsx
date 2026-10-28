"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
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
import { CONTENT_KINDS, type ContentData } from "@/lib/content-kinds";

import { toast } from "@/components/admin/toast";
export interface ContentRow {
  id: string;
  data: ContentData;
  isHidden: boolean;
}

const fieldClass =
  "flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:outline-none";

async function request(url: string, init: RequestInit) {
  const res = await fetch(url, { headers: { "Content-Type": "application/json" }, ...init });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || "Something went wrong, please try again");
  }
  return res.status === 204 ? null : res.json();
}

function Row({
  item,
  kindKey,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: ContentRow;
  kindKey: string;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const kind = CONTENT_KINDS[kindKey];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const image = kind.fields.find((field) => field.type === "image");
  const title = item.data[kind.titleField] || (image ? "Photo" : "Untitled");
  const subtitle = kind.subtitleField ? item.data[kind.subtitleField] : "";

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 bg-white px-4 py-3 ${isDragging ? "relative z-10 shadow-lg" : ""}`}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-gray-400 hover:text-gray-700"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>
      {image && item.data[image.key] && (
        <img src={item.data[image.key]} alt="" className="h-12 w-12 shrink-0 rounded object-cover" />
      )}
      <div className={`min-w-0 flex-1 ${item.isHidden ? "opacity-50" : ""}`}>
        <p className="truncate font-medium text-gray-900">{title}</p>
        {subtitle && <p className="truncate text-sm text-gray-500">{subtitle}</p>}
      </div>
      {item.isHidden && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Hidden</span>
      )}
      <button
        type="button"
        onClick={onToggle}
        className="rounded p-2 text-gray-500 hover:bg-gray-100"
        aria-label={item.isHidden ? "Show on the website" : "Hide from the website"}
        title={item.isHidden ? "Show on the website" : "Hide from the website"}
      >
        {item.isHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
      <button
        type="button"
        onClick={onEdit}
        className="rounded p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Edit"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded p-2 text-red-500 hover:bg-red-50"
        aria-label="Delete"
        title="Delete"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </li>
  );
}

export default function ContentManager({
  kindKey,
  initialItems,
}: {
  kindKey: string;
  initialItems: ContentRow[];
}) {
  const kind = CONTENT_KINDS[kindKey];
  const [items, setItems] = useState(initialItems);
  // null: closed; "new": adding; otherwise the id being edited
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ContentData>({});
  const [mediaField, setMediaField] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const atLimit = kind.limit !== undefined && items.length >= kind.limit;

  const openForm = (item?: ContentRow) => {
    setEditing(item?.id ?? "new");
    setForm(
      item
        ? { ...item.data }
        : Object.fromEntries(kind.fields.map((field) => [field.key, field.options?.[0] ?? ""]))
    );
    setError("");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editing === "new") {
        const item = await request("/api/content", {
          method: "POST",
          body: JSON.stringify({ kind: kind.kind, data: form }),
        });
        setItems((current) => [...current, item]);
      } else {
        const item = await request(`/api/content/${editing}`, {
          method: "PUT",
          body: JSON.stringify({ data: form }),
        });
        setItems((current) => current.map((row) => (row.id === item.id ? item : row)));
      }
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save");
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (item: ContentRow) => {
    try {
      const updated = await request(`/api/content/${item.id}`, {
        method: "PUT",
        body: JSON.stringify({ isHidden: !item.isHidden }),
      });
      setItems((current) => current.map((row) => (row.id === updated.id ? updated : row)));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't update");
    }
  };

  const remove = async (item: ContentRow) => {
    if (!confirm(`Delete this ${kind.singular}? This can't be undone.`)) return;
    try {
      await request(`/api/content/${item.id}`, { method: "DELETE" });
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't delete");
    }
  };

  const onDragEnd = async ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const previous = items;
    const next = arrayMove(
      items,
      items.findIndex((row) => row.id === active.id),
      items.findIndex((row) => row.id === over.id)
    );
    setItems(next);
    try {
      await request("/api/content/reorder", {
        method: "PUT",
        body: JSON.stringify({ kind: kind.kind, ids: next.map((row) => row.id) }),
      });
    } catch (err) {
      setItems(previous);
      toast(err instanceof Error ? err.message : "Couldn't save the new order");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">{kind.title}</h1>
          <p className="max-w-2xl text-sm text-gray-600">{kind.description}</p>
        </div>
        <Button type="button" onClick={() => openForm()} disabled={atLimit}>
          <Plus className="mr-2 h-4 w-4" />
          Add {kind.singular}
        </Button>
      </div>
      {atLimit && (
        <p className="text-sm text-amber-700">
          That&apos;s the most this section shows ({kind.limit}). Delete or edit one to change it.
        </p>
      )}

      <Card>
        <CardContent className="p-0">
          {items.length === 0 ? (
            <p className="p-8 text-center text-gray-500">Nothing here yet.</p>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={items.map((row) => row.id)} strategy={verticalListSortingStrategy}>
                <ul className="divide-y">
                  {items.map((item) => (
                    <Row
                      key={item.id}
                      item={item}
                      kindKey={kindKey}
                      onEdit={() => openForm(item)}
                      onToggle={() => toggle(item)}
                      onDelete={() => remove(item)}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>
      {items.length > 1 && (
        <p className="text-xs text-gray-500">Drag the handle on the left to change the order on the website.</p>
      )}

      <Dialog open={editing !== null} onOpenChange={(open) => !open && setEditing(null)}>
        {/* bg-white: the dialog's default bg-background colour isn't defined in this theme */}
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing === "new" ? `Add ${kind.singular}` : `Edit ${kind.singular}`}
            </DialogTitle>
            <DialogDescription className="sr-only">{kind.description}</DialogDescription>
          </DialogHeader>
          <form onSubmit={save} className="space-y-4">
            {kind.fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={`field-${field.key}`}>
                  {field.label}
                  {!field.required && <span className="font-normal text-gray-400"> (optional)</span>}
                </Label>
                {field.type === "textarea" ? (
                  <textarea
                    id={`field-${field.key}`}
                    rows={6}
                    className={fieldClass}
                    value={form[field.key] ?? ""}
                    maxLength={field.max}
                    placeholder={field.placeholder}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                ) : field.type === "select" ? (
                  <select
                    id={`field-${field.key}`}
                    className={`${fieldClass} h-10`}
                    value={form[field.key] ?? ""}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  >
                    {field.options?.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === "image" ? (
                  <div className="space-y-2">
                    {form[field.key] && (
                      <img
                        src={form[field.key]}
                        alt=""
                        className="h-40 w-40 rounded-md border object-cover"
                      />
                    )}
                    <Button type="button" variant="outline" onClick={() => setMediaField(field.key)}>
                      {form[field.key] ? "Change photo" : "Choose photo"}
                    </Button>
                  </div>
                ) : (
                  <Input
                    id={`field-${field.key}`}
                    type={field.type === "url" ? "url" : "text"}
                    value={form[field.key] ?? ""}
                    maxLength={field.max}
                    placeholder={field.placeholder}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                  />
                )}
                {field.help && <p className="text-xs text-gray-500">{field.help}</p>}
              </div>
            ))}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MediaLibrary
        open={mediaField !== null}
        folder={kind.folder ?? "pages"}
        onClose={() => setMediaField(null)}
        onSelect={(url) => {
          if (mediaField) setForm((current) => ({ ...current, [mediaField]: url }));
          setMediaField(null);
        }}
      />
    </div>
  );
}
