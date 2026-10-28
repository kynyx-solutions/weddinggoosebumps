import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import DestinationsList from "./DestinationsList";

export default async function DestinationsPage() {
  await requireAdmin();
  const destinations = await prisma.destination.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      region: true,
      heroImage: true,
      isHidden: true,
      _count: { select: { posts: true } },
    },
  });

  return (
    <DestinationsList
      initialItems={destinations.map(({ _count, ...d }) => ({ ...d, postCount: _count.posts }))}
    />
  );
}
