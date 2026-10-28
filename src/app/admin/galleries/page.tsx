import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { GALLERY_CARDS } from "@/app/galleries/gallery-cards";
import GalleriesManager from "./GalleriesManager";

export default async function GalleriesAdminPage() {
  await requireAdmin();
  const albums = await prisma.gallery.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      heading: true,
      subheading: true,
      coverImage: true,
      isHidden: true,
      _count: { select: { photos: true } },
    },
  });

  return (
    <GalleriesManager
      builtInCount={GALLERY_CARDS.length}
      initialAlbums={albums.map(({ _count, ...album }) => ({ ...album, photoCount: _count.photos }))}
    />
  );
}
