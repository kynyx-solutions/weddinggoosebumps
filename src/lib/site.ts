import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import prisma from "./prisma";
import {
  DEFAULT_CONTACT_ADDRESS,
  DEFAULT_MAP_EMBED_SRC,
  DEFAULT_MAP_LINK,
  DEFAULT_WHATSAPP_EVENT_MESSAGE,
  DEFAULT_WHATSAPP_MESSAGE,
  DEFAULT_WHATSAPP_NUMBER,
  whatsappLink,
} from "./whatsapp";

export { whatsappLink };

export const SITE_URL = "https://weddinggoosebumps.com";

// Served at /robots.txt on the live domain unless SEO settings hold a custom version
export const DEFAULT_ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /login

Sitemap: ${SITE_URL}/sitemap.xml
`;

export interface ContactSettings {
  whatsappNumber: string;
  whatsappMessage: string;
  whatsappEventMessage: string;
  contactAddress: string | null;
  mapUrl: string | null;
  showMap: boolean;
}

const DEFAULT_CONTACT: ContactSettings = {
  whatsappNumber: DEFAULT_WHATSAPP_NUMBER,
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  whatsappEventMessage: DEFAULT_WHATSAPP_EVENT_MESSAGE,
  contactAddress: DEFAULT_CONTACT_ADDRESS,
  mapUrl: null,
  showMap: true,
};

const loadContactSettings = unstable_cache(
  async (): Promise<ContactSettings> => {
    const settings = await prisma.globalSettings.findUnique({ where: { id: "global" } });
    return {
      whatsappNumber: settings?.whatsappNumber?.replace(/\D/g, "") || DEFAULT_WHATSAPP_NUMBER,
      whatsappMessage: settings?.whatsappMessage?.trim() || DEFAULT_WHATSAPP_MESSAGE,
      whatsappEventMessage: settings?.whatsappEventMessage?.trim() || DEFAULT_WHATSAPP_EVENT_MESSAGE,
      contactAddress: settings?.contactAddress?.trim() || DEFAULT_CONTACT_ADDRESS,
      mapUrl: settings?.mapUrl?.trim() || null,
      showMap: settings?.showMap ?? true,
    };
  },
  ["contact-settings"],
  { tags: ["settings"] }
);

// The WhatsApp button is on every page, so a database hiccup falls back to the defaults
// (uncached) rather than breaking the page
export async function getContactSettings(): Promise<ContactSettings> {
  try {
    return await loadContactSettings();
  } catch (error) {
    console.error("[CONTACT_SETTINGS]", error);
    return DEFAULT_CONTACT;
  }
}

export function whatsappMessageFor(settings: ContactSettings, eventTitle?: string) {
  return eventTitle
    ? settings.whatsappEventMessage.replaceAll("{event}", eventTitle)
    : settings.whatsappMessage;
}

// The studio's exact listing applies only while its own address is shown; a different address
// gets a search for that address instead
function isStudioAddress(settings: ContactSettings) {
  return settings.contactAddress === DEFAULT_CONTACT_ADDRESS;
}

export function mapEmbedSrc(settings: ContactSettings) {
  if (isStudioAddress(settings)) return DEFAULT_MAP_EMBED_SRC;
  return `https://www.google.com/maps?q=${encodeURIComponent(settings.contactAddress ?? "")}&output=embed`;
}

export function mapsLink(settings: ContactSettings) {
  if (settings.mapUrl) return settings.mapUrl;
  if (isStudioAddress(settings)) return DEFAULT_MAP_LINK;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.contactAddress ?? "")}`;
}

// Public pages cache their database reads; call this after an admin change so visitors see it
// straight away. The layout-level path refresh also covers pages built ahead of time (Inquire,
// Galleries) whose navbar event list would otherwise stay as it was at deploy.
export function refreshPublicPages(...tags: string[]) {
  for (const tag of tags) revalidateTag(tag);
  revalidatePath("/", "layout");
}
