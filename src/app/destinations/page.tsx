import Image from "next/image";
import Link from "next/link";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { getDestinations } from "@/lib/destinations";
import { DESTINATION_REGIONS } from "@/lib/destination-fields";

export const metadata = {
  title: "Destination Weddings",
  description:
    "Destinations where Wedding Goosebumps plans luxury weddings across India, Europe and the Middle East.",
};

export default async function DestinationsPage() {
  const destinations = await getDestinations();
  // Grouped by region in a fixed order; destinations without one come last
  const groups = [...DESTINATION_REGIONS, ""]
    .map((region) => ({
      region,
      items: destinations.filter((d) => (d.region ?? "") === region),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <main className="bg-ivory text-charcoal min-h-screen">
      <div className="relative z-50">
        <Navigation />
      </div>

      <section className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <div className="mb-16 text-center">
            <h1 className="font-epicene-display mb-4 text-[32px] leading-[1.1] font-light sm:text-[42px] md:text-[50px]">
              Destinations
            </h1>
            <p className="font-lora text-charcoal/80 mx-auto max-w-2xl text-[15px] sm:text-[17px]">
              From the royal palaces of Rajasthan to the shores of Lake Como, the places we turn
              into goosebump-worthy celebrations.
            </p>
          </div>

          {groups.length === 0 ? (
            <div className="text-charcoal/60 font-lora py-20 text-center">
              Destination guides are coming soon.
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.region || "more"} className="mb-16 last:mb-0">
                <p className="font-commuter-sans text-charcoal/60 mb-8 text-center text-[11px] tracking-[0.3em] uppercase">
                  {group.region || "More destinations"}
                </p>
                <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((destination, idx) => (
                    <Link key={destination.id} href={`/destinations/${destination.slug}`} className="group block">
                      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#efe9df]">
                        {destination.heroImage && (
                          <Image
                            src={destination.heroImage}
                            alt={destination.name}
                            fill
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform group-hover:scale-[1.01]"
                            loading={idx < 3 ? "eager" : "lazy"}
                          />
                        )}
                      </div>
                      <h2 className="font-epicene-display mt-6 text-[20px] tracking-[0.02em] uppercase md:text-[22px]">
                        {destination.name}
                      </h2>
                      <div className="bg-charcoal/15 mt-3 h-[2px] w-16" />
                      {destination.tagline && (
                        <p className="text-gold mt-3 text-[12px] tracking-[0.25em] uppercase">
                          {destination.tagline}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}
