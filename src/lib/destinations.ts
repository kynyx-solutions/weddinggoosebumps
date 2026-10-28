import { unstable_cache } from "next/cache";
import type { Destination } from "@prisma/client";
import prisma from "./prisma";

export const DESTINATIONS_TAG = "destinations";

const loadDestinations = unstable_cache(
  () =>
    prisma.destination.findMany({
      where: { isHidden: false },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
  ["destinations"],
  { tags: [DESTINATIONS_TAG] }
);

// Visible destinations in the admin's order; empty if the database can't be reached
export async function getDestinations(): Promise<Destination[]> {
  try {
    return (await loadDestinations()).map((d) => ({
      ...d,
      createdAt: new Date(d.createdAt),
      updatedAt: new Date(d.updatedAt),
    }));
  } catch (error) {
    console.error("[DESTINATIONS]", error);
    return [];
  }
}

export async function getDestination(slug: string) {
  return (await getDestinations()).find((d) => d.slug === slug) ?? null;
}

// "One per line" admin fields as a list
export function lines(text: string | null) {
  return (text ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
