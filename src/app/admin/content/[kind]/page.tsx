import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { CONTENT_KINDS, type ContentData } from "@/lib/content-kinds";
import ContentManager from "./ContentManager";

export default async function ContentPage({ params }: { params: Promise<{ kind: string }> }) {
  await requireAdmin();
  const { kind } = await params;
  if (!CONTENT_KINDS[kind]) notFound();

  const items = await prisma.contentItem.findMany({
    where: { kind },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, data: true, isHidden: true },
  });

  return (
    <ContentManager
      key={kind}
      kindKey={kind}
      initialItems={items.map((item) => ({ ...item, data: item.data as ContentData }))}
    />
  );
}
