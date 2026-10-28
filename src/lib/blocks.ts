// Extra content blocks on a post (editor's Blocks tab), stored as the post's "blocks" section.
// Shared by the editor and the public page, so no database code here.

export type Block =
  | { id: string; type: "gallery"; images: { src: string; alt: string }[] }
  | { id: string; type: "film"; url: string; caption: string }
  | { id: string; type: "facts"; items: { label: string; value: string }[] }
  | { id: string; type: "quote"; text: string; author: string }
  | { id: string; type: "button"; label: string; href: string }
  | { id: string; type: "faq"; items: { question: string; answer: string }[] };

export type BlockType = Block["type"];

export const BLOCK_TYPES: { type: BlockType; label: string; hint: string }[] = [
  { type: "gallery", label: "Photo gallery", hint: "A grid of photos" },
  { type: "film", label: "Film", hint: "A YouTube or Vimeo video" },
  { type: "facts", label: "At a glance", hint: "Destination, guests, days..." },
  { type: "quote", label: "Quote", hint: "Words from the couple" },
  { type: "button", label: "Button", hint: "A link styled like the site's buttons" },
  { type: "faq", label: "Questions", hint: "Questions and answers" },
];

export function newBlock(type: BlockType): Block {
  const id = Math.random().toString(36).slice(2, 10);
  switch (type) {
    case "gallery":
      return { id, type, images: [] };
    case "film":
      return { id, type, url: "", caption: "" };
    case "facts":
      return {
        id,
        type,
        items: [
          { label: "Destination", value: "" },
          { label: "Guests", value: "" },
          { label: "Celebrations", value: "" },
        ],
      };
    case "quote":
      return { id, type, text: "", author: "" };
    case "button":
      return { id, type, label: "Plan your celebration", href: "/inquire" };
    case "faq":
      return { id, type, items: [{ question: "", answer: "" }] };
  }
}

// YouTube or Vimeo page link → privacy-friendly embed address; null if it isn't one
export function videoEmbedUrl(url: string): string | null {
  const youtube = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (youtube) return `https://www.youtube-nocookie.com/embed/${youtube[1]}`;
  const vimeo = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

// Blocks still empty in the editor are left off the page
export function isBlockFilled(block: Block) {
  switch (block.type) {
    case "gallery":
      return block.images.length > 0;
    case "film":
      return videoEmbedUrl(block.url) !== null;
    case "facts":
      return block.items.some((item) => item.value.trim());
    case "quote":
      return block.text.trim().length > 0;
    case "button":
      return block.label.trim().length > 0 && block.href.trim().length > 0;
    case "faq":
      return block.items.some((item) => item.question.trim() && item.answer.trim());
  }
}
