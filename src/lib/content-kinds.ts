// The lists managed under Admin → Site Content. Shared by the admin screens and the API, so it
// must stay free of database code.

export type ContentFieldType = "text" | "textarea" | "image" | "url" | "select";

export interface ContentField {
  key: string;
  label: string;
  type: ContentFieldType;
  required?: boolean;
  max?: number;
  options?: string[];
  placeholder?: string;
  help?: string;
}

export interface ContentKind {
  kind: string;
  title: string;
  singular: string;
  description: string;
  fields: ContentField[];
  // The field shown as each row's title in the admin list
  titleField: string;
  subtitleField?: string;
  limit?: number;
  // Media library folder for image fields
  folder?: string;
}

export const CONTENT_KINDS: Record<string, ContentKind> = {
  stat: {
    kind: "stat",
    title: "Stats",
    singular: "stat",
    description:
      "The numbers band at the end of the About page. Until you add your own, it shows 15+ years of experience and 150+ weddings, from the text already on the site.",
    fields: [
      { key: "value", label: "Number", type: "text", required: true, max: 20, placeholder: "150+" },
      {
        key: "label",
        label: "Label",
        type: "text",
        required: true,
        max: 60,
        placeholder: "Weddings brought to life",
      },
    ],
    titleField: "value",
    subtitleField: "label",
    limit: 4,
  },
  faq: {
    kind: "faq",
    title: "FAQs",
    singular: "question",
    description:
      "Questions and answers shown below the contact details on the Inquire page and at the end of the Offerings page. The section stays hidden until there's at least one.",
    fields: [
      { key: "question", label: "Question", type: "text", required: true, max: 300 },
      { key: "answer", label: "Answer", type: "textarea", required: true, max: 4000 },
      {
        key: "page",
        label: "Show on",
        type: "select",
        required: true,
        options: ["Both pages", "Inquire", "Offerings"],
      },
    ],
    titleField: "question",
    subtitleField: "page",
  },
  instagram: {
    kind: "instagram",
    title: "Instagram Tiles",
    singular: "tile",
    description:
      "A grid of photos at the end of the Galleries page, each linking to its Instagram post. Six work best. Hidden until you add one.",
    fields: [
      { key: "image", label: "Photo", type: "image", required: true },
      {
        key: "link",
        label: "Instagram post link",
        type: "url",
        max: 500,
        placeholder: "https://www.instagram.com/p/...",
        help: "Leave empty to link to your profile.",
      },
      {
        key: "alt",
        label: "Photo description",
        type: "text",
        max: 200,
        placeholder: "Bride and groom under the floral mandap",
        help: "Read by Google and screen readers.",
      },
    ],
    titleField: "alt",
    subtitleField: "link",
    limit: 12,
    folder: "pages",
  },
  author: {
    kind: "author",
    title: "Authors",
    singular: "author",
    description:
      "Saved author profiles. In a post's Journal tab, pick one to fill in the name, role and photo in one go.",
    fields: [
      { key: "name", label: "Name", type: "text", required: true, max: 100 },
      { key: "role", label: "Role", type: "text", max: 100, placeholder: "Founder & Creative Director" },
      { key: "photo", label: "Photo", type: "image" },
      { key: "bio", label: "Short bio", type: "textarea", max: 600 },
    ],
    titleField: "name",
    subtitleField: "role",
    folder: "team",
  },
};

export type ContentData = Record<string, string>;

// Trims and checks one item's fields against its kind; returns the cleaned data or a message
export function cleanContentData(
  kind: ContentKind,
  input: unknown
): { data: ContentData } | { error: string } {
  const source = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const data: ContentData = {};

  for (const field of kind.fields) {
    const raw = source[field.key];
    const value = typeof raw === "string" ? raw.trim() : "";

    if (field.required && !value) return { error: `${field.label} is required` };
    if (field.max && value.length > field.max) {
      return { error: `${field.label} can be at most ${field.max} characters` };
    }
    if (value && field.type === "url" && !/^https?:\/\//i.test(value)) {
      return { error: `${field.label} must start with https://` };
    }
    if (value && field.type === "select" && !field.options?.includes(value)) {
      return { error: `Pick one of the options for ${field.label}` };
    }
    data[field.key] = value;
  }

  return { data };
}
