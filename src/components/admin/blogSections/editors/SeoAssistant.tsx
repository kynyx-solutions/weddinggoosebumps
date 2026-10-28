"use client";

import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { slugify } from "@/lib/slug";

export interface SeoPostInfo {
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string;
  body: string;
}

interface SeoValues {
  metaTitle: string;
  metaKeywords: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
}

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 160;

function cut(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function LengthHint({ length, max }: { length: number; max: number }) {
  const tone = length === 0 ? "text-gray-400" : length > max ? "text-red-600" : "text-green-700";
  return (
    <p className={`text-xs ${tone}`}>
      {length}/{max} characters{length > max ? " · Google will cut the rest" : ""}
    </p>
  );
}

// Previews of the Google result and the WhatsApp/Facebook share card, plus quick checks
export default function SeoAssistant({
  post,
  values,
  onFill,
}: {
  post: SeoPostInfo;
  values: SeoValues;
  onFill: (changes: Partial<SeoValues>) => void;
}) {
  const title = values.metaTitle || post.title;
  const description = values.metaDescription || post.excerpt;
  const shareTitle = values.ogTitle || title;
  const shareDescription = values.ogDescription || description;
  const shareImage = values.ogImage || post.coverImage;
  const path = slugify(post.slug);

  const keyword = values.metaKeywords.split(",")[0]?.trim().toLowerCase() ?? "";
  const text = (value: string) => value.toLowerCase();
  const storyStart = post.body.replace(/<[^>]+>/g, " ").slice(0, 600);
  const checks = [
    { ok: title.length > 0 && title.length <= TITLE_MAX, label: `Title is 1–${TITLE_MAX} characters` },
    {
      ok: description.length >= 70 && description.length <= DESCRIPTION_MAX,
      label: `Description is 70–${DESCRIPTION_MAX} characters`,
    },
    { ok: Boolean(shareImage), label: "Has a picture for sharing (cover or OG image)" },
    ...(keyword
      ? [
          { ok: text(title).includes(keyword), label: `"${keyword}" is in the title` },
          { ok: text(description).includes(keyword), label: `"${keyword}" is in the description` },
          { ok: path.includes(slugify(keyword)), label: `"${keyword}" is in the page address` },
          {
            ok: text(post.excerpt + " " + storyStart).includes(keyword),
            label: `"${keyword}" appears early in the post`,
          },
        ]
      : []),
  ];

  const fill = () =>
    onFill({
      ...(!values.metaTitle && { metaTitle: cut(post.title, TITLE_MAX) }),
      ...(!values.metaDescription && post.excerpt && { metaDescription: cut(post.excerpt, DESCRIPTION_MAX) }),
      ...(!values.ogTitle && { ogTitle: values.metaTitle || cut(post.title, TITLE_MAX) }),
      ...(!values.ogDescription &&
        (values.metaDescription || post.excerpt) && {
          ogDescription: values.metaDescription || cut(post.excerpt, DESCRIPTION_MAX),
        }),
    });

  return (
    <div className="space-y-4 rounded-lg border bg-gray-50 p-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">In Google</p>
          <div className="rounded-md bg-white p-4 shadow-sm">
            <p className="truncate text-xs text-gray-600">weddinggoosebumps.com › events › {path || "…"}</p>
            <p className="mt-1 text-[18px] leading-snug text-[#1a0dab]">{cut(title || "Post title", TITLE_MAX)}</p>
            <p className="mt-1 line-clamp-2 text-sm text-gray-600">
              {description ? cut(description, DESCRIPTION_MAX) : "Add an excerpt or a description so Google doesn't pick one itself."}
            </p>
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">Shared on WhatsApp / Facebook</p>
          <div className="overflow-hidden rounded-md bg-white shadow-sm">
            {shareImage ? (
              <img src={shareImage} alt="" className="aspect-[1.91/1] w-full object-cover" />
            ) : (
              <div className="flex aspect-[1.91/1] items-center justify-center bg-gray-100 text-xs text-gray-400">No picture</div>
            )}
            <div className="p-3">
              <p className="text-[11px] text-gray-500 uppercase">weddinggoosebumps.com</p>
              <p className="truncate text-sm font-semibold text-gray-900">{shareTitle || "Post title"}</p>
              <p className="line-clamp-1 text-xs text-gray-600">{shareDescription}</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium tracking-wide text-gray-500 uppercase">
          Checks{keyword ? "" : " · add a keyword below to check it too (the first one is used)"}
        </p>
        <ul className="grid gap-1 text-sm sm:grid-cols-2">
          {checks.map((check) => (
            <li key={check.label} className="flex items-center gap-2">
              {check.ok ? <Check className="h-4 w-4 shrink-0 text-green-600" /> : <X className="h-4 w-4 shrink-0 text-red-500" />}
              <span className={check.ok ? "text-gray-700" : "text-gray-900"}>{check.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={fill}>
          Fill empty fields from the post
        </Button>
        <p className="text-xs text-gray-500">
          Article and breadcrumb data for Google is added to the page automatically.
        </p>
      </div>
    </div>
  );
}
