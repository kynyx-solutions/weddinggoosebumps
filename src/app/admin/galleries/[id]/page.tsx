import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import AlbumEditor from "./AlbumEditor";

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const album = await prisma.gallery.findUnique({
    where: { id },
    include: { photos: { orderBy: { sortOrder: "asc" } } },
  });
  if (!album) notFound();

  return (
    <AlbumEditor
      album={{
        id: album.id,
        slug: album.slug,
        heading: album.heading,
        subheading: album.subheading ?? "",
        coverImage: album.coverImage,
      }}
      initialPhotos={album.photos.map((photo) => ({
        id: photo.id,
        src: photo.src,
        width: photo.width,
        height: photo.height,
        alt: photo.alt ?? "",
      }))}
    />
  );
}
