import { unstable_cache } from "next/cache";
import prisma from "./prisma";
import type { GalleryCardData } from "@/app/galleries/gallery-cards";

export const GALLERIES_TAG = "galleries";

export interface GalleryPhotoData {
  src: string;
  width: number;
  height: number;
  alt?: string;
}

const loadAlbums = unstable_cache(
  async () => {
    const [total, albums] = await Promise.all([
      prisma.gallery.count(),
      prisma.gallery.findMany({
        where: { isHidden: false },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: { slug: true, heading: true, subheading: true, coverImage: true },
      }),
    ]);
    return { total, albums };
  },
  ["gallery-albums"],
  { tags: [GALLERIES_TAG] }
);

// Album cards for the Galleries page, or null while nothing has been imported into the admin
// panel (the page then shows its built-in albums)
export async function getGalleryCards(): Promise<GalleryCardData[] | null> {
  try {
    const { total, albums } = await loadAlbums();
    if (total === 0) return null;
    return albums.map((album) => ({
      image: album.coverImage,
      heading: album.heading,
      subheading: album.subheading ?? "",
      slug: album.slug,
    }));
  } catch (error) {
    console.error("[GALLERIES]", error);
    return null;
  }
}

const loadPhotos = unstable_cache(
  (slug: string) =>
    prisma.gallery.findUnique({
      where: { slug },
      select: {
        isHidden: true,
        photos: {
          orderBy: { sortOrder: "asc" },
          select: { src: true, width: true, height: true, alt: true },
        },
      },
    }),
  ["gallery-photos"],
  { tags: [GALLERIES_TAG] }
);

// An album's photos from the admin panel; null when it isn't there (built-in albums then apply)
export async function getGalleryPhotos(slug: string): Promise<GalleryPhotoData[] | null> {
  try {
    const album = await loadPhotos(slug);
    if (!album || album.isHidden) return null;
    return album.photos.map((photo) => ({ ...photo, alt: photo.alt ?? undefined }));
  } catch (error) {
    console.error("[GALLERY_PHOTOS]", error);
    return null;
  }
}
