import prisma from "@/lib/prisma";

export default async function SeoScripts({ slug }: { slug: string }) {
  const page = await prisma.page.findUnique({
    where: { slug }
  });
  // console.log("page url");
  // console.log(page);
  if (!page || !page.structuredData) {
    return null;
  }

  return (
    <div dangerouslySetInnerHTML={{ __html: page.structuredData }} />
  );
}
