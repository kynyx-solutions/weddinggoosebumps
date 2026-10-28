// Safe to import in the browser (no database code), unlike site.ts

// The number the footer already links to; used until one is saved in Site Settings
export const DEFAULT_WHATSAPP_NUMBER = "917004734213";
export const DEFAULT_WHATSAPP_MESSAGE =
  "Hi Wedding Goosebumps! I'm planning my wedding and would love to know more about your services.";
export const DEFAULT_WHATSAPP_EVENT_MESSAGE =
  'Hi Wedding Goosebumps! I just saw "{event}" on your website and would love to plan something similar.';

// Office address shown in "Visit Us" on the Inquire page until a different one is saved in
// Site Settings (given by the client on 2026-10-28)
export const DEFAULT_CONTACT_ADDRESS = "67 B T Road, Narendranagar\nKolkata – 700056";

// The studio's own Google Maps listing (Wedding Goosebumps, Kolkata), given by the client: the
// map pin on the Inquire page, and where clicking the address leads. Used while the address
// above is the one shown.
export const DEFAULT_MAP_EMBED_SRC =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3989.9422204943485!2d88.42613019934724!3d22.570037528410474!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a02758aca4c1449%3A0x4782f7894a75873d!2sWedding%20Goosebumps!5e0!3m2!1sen!2sin!4v1793176878419!5m2!1sen!2sin";
export const DEFAULT_MAP_LINK = "https://maps.google.com/?cid=5152953092697065277";

export function whatsappLink(number: string, message: string) {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

// WhatsApp logo (24×24 view box), shared by the floating button and the share links
export const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";
