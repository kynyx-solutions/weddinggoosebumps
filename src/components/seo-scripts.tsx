import { getSeoPage } from "@/lib/seo";

export default async function SeoScripts({ slug }: { slug: string }) {
  const page = await getSeoPage(slug);
  // console.log("page url");
  // console.log(page);
  if (!page || !page.structuredData) {
    return null;
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: page.structuredData }} />
  );
}
