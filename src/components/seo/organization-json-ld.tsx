import { getContactSettings, SITE_URL } from "@/lib/site";

// Business details for Google (knowledge panel, Maps); the address appears once it's saved
// in Site Settings
export default async function OrganizationJsonLd() {
  const contact = await getContactSettings();
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Wedding Goosebumps",
    url: `${SITE_URL}/`,
    logo: `${SITE_URL}/logo/Logo.png`,
    description:
      "Luxury wedding planning and design studio creating destination weddings across India, Europe and the Middle East.",
    email: "weddinggoosebumps@gmail.com",
    // The phone number shown in the footer and on the Inquire page
    telephone: "+91-7004734213",
    ...(contact.contactAddress && {
      address: {
        "@type": "PostalAddress",
        streetAddress: contact.contactAddress.replace(/\s*\n\s*/g, ", "),
        addressCountry: "IN",
      },
    }),
    sameAs: [
      "https://www.instagram.com/weddinggoosebumps",
      "https://www.facebook.com/weddinggoosebumps/",
      "https://in.pinterest.com/weddinggoosebumps/",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
