// Shared by the destination editor (browser) and its API, so no database code here

export const DESTINATION_REGIONS = ["India", "Europe", "Middle East", "Asia", "Africa", "Americas"];

export interface DestinationInput {
  name: string;
  slug: string;
  region: string;
  tagline: string;
  heroImage: string;
  intro: string;
  bestSeason: string;
  highlights: string;
  venues: string;
  metaTitle: string;
  metaDescription: string;
  isHidden: boolean;
}

const LIMITS: Partial<Record<keyof DestinationInput, number>> = {
  name: 100,
  tagline: 160,
  heroImage: 500,
  intro: 6000,
  bestSeason: 120,
  highlights: 3000,
  venues: 3000,
  metaTitle: 120,
  metaDescription: 320,
};

export function checkDestination(input: Partial<DestinationInput>): string | null {
  if (!input.name?.trim()) return "Please enter the destination's name";
  for (const [field, max] of Object.entries(LIMITS)) {
    const value = input[field as keyof DestinationInput];
    if (typeof value === "string" && value.length > max!) return `${field} is too long (max ${max} characters)`;
  }
  if (input.region && !DESTINATION_REGIONS.includes(input.region)) return "Pick a region from the list";
  return null;
}

const text = (value: unknown) => (typeof value === "string" && value.trim() ? value.trim() : null);

// Fields as stored by the destinations API
export function destinationData(json: Record<string, unknown>) {
  return {
    name: String(json.name ?? "").trim(),
    region: text(json.region),
    tagline: text(json.tagline),
    heroImage: text(json.heroImage),
    intro: text(json.intro),
    bestSeason: text(json.bestSeason),
    highlights: text(json.highlights),
    venues: text(json.venues),
    metaTitle: text(json.metaTitle),
    metaDescription: text(json.metaDescription),
    isHidden: json.isHidden === true,
  };
}
