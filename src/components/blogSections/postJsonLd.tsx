import type { BlogPost } from "@prisma/client";
import { canonicalPostUrl } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

const absolute = (src: string) => (src.startsWith("/") ? `${SITE_URL}${src}` : src);

function jsonLd(data: unknown) {
  // "<" escaped so text inside the data can't close the script tag
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}

// Article and breadcrumb data for Google, plus any structured data typed into the post's SEO tab
export default function PostJsonLd({
  post,
  image,
  authorName,
}: {
  post: BlogPost;
  image: string;
  authorName: string;
}) {
  const url = canonicalPostUrl(post);
  const article = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt || undefined,
    image: image ? [absolute(image)] : undefined,
    datePublished: (post.publishDate ?? post.createdAt).toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { "@type": "Person", name: authorName },
    publisher: {
      "@type": "Organization",
      name: "Wedding Goosebumps",
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo/Logo.png` },
    },
    mainEntityOfPage: url,
  };
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Events", item: `${SITE_URL}/events` },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  };

  const custom = post.structuredData?.trim();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(article)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(breadcrumbs)} />
      {/* Same rule as the page SEO field: raw markup goes in as-is, bare JSON gets a script tag */}
      {custom &&
        (custom.startsWith("<") ? (
          <div hidden dangerouslySetInnerHTML={{ __html: custom }} />
        ) : (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: custom.replace(/</g, "\\u003c") }}
          />
        ))}
    </>
  );
}
