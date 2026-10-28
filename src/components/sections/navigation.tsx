import NavigationClient from "./NavigationClient";
import { getEventLinks } from "@/lib/posts";
import { getContactSettings, whatsappLink, whatsappMessageFor } from "@/lib/site";

// eventTitle: on an event page, the WhatsApp button's ready-typed message names that event
export default async function Navigation({ eventTitle }: { eventTitle?: string } = {}) {
  const [eventLinks, contact] = await Promise.all([getEventLinks(), getContactSettings()]);

  return (
    <NavigationClient
      eventLinks={eventLinks}
      whatsappHref={whatsappLink(contact.whatsappNumber, whatsappMessageFor(contact, eventTitle))}
    />
  );
}
