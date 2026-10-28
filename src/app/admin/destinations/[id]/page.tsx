import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import DestinationForm from "./DestinationForm";

export default async function EditDestinationPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (id === "new") return <DestinationForm initial={null} />;

  const destination = await prisma.destination.findUnique({ where: { id } });
  if (!destination) notFound();

  return (
    <DestinationForm
      initial={{
        id: destination.id,
        name: destination.name,
        slug: destination.slug,
        region: destination.region ?? "",
        tagline: destination.tagline ?? "",
        heroImage: destination.heroImage ?? "",
        intro: destination.intro ?? "",
        bestSeason: destination.bestSeason ?? "",
        highlights: destination.highlights ?? "",
        venues: destination.venues ?? "",
        metaTitle: destination.metaTitle ?? "",
        metaDescription: destination.metaDescription ?? "",
        isHidden: destination.isHidden,
      }}
    />
  );
}
