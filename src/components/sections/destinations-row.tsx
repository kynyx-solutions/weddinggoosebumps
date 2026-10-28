import Image from "next/image";
import Link from "next/link";
import { getDestinations } from "@/lib/destinations";

// "Where we celebrate" on the home page: the first four destinations; nothing until one is added
export default async function DestinationsRow() {
  const destinations = (await getDestinations()).slice(0, 4);
  if (destinations.length === 0) return null;

  return (
    <section className="bg-ivory text-charcoal pb-16 sm:pb-20 md:pb-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="text-center">
          <p className="font-commuter-sans text-gold text-[11px] font-bold tracking-[0.3em] uppercase sm:text-[13px]">
            Where we celebrate
          </p>
          <div className="mx-auto mt-4 h-[2px] w-14 bg-[#D9D5CF]" />
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:mt-12 sm:gap-x-6 lg:grid-cols-4">
          {destinations.map((destination, idx) => (
            <Link key={destination.id} href={`/destinations/${destination.slug}`} className="group block">
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#efe9df]">
                {destination.heroImage && (
                  <Image
                    src={destination.heroImage}
                    alt={destination.name}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    loading={idx < 2 ? "eager" : "lazy"}
                  />
                )}
              </div>
              <h3 className="font-epicene-display mt-5 text-[18px] tracking-[0.02em] uppercase sm:text-[20px]">
                {destination.name}
              </h3>
              <div className="bg-charcoal/15 mt-3 h-[2px] w-12" />
              {destination.region && (
                <p className="text-gold mt-3 text-[10px] tracking-[0.25em] uppercase sm:text-[11px]">
                  {destination.region}
                </p>
              )}
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/destinations" className="inline-block">
            <span className="font-commuter-sans text-gold border-gold hover:border-gold/70 border-b-[1.4px] pb-1 text-[10px] tracking-[0.3em] uppercase transition-colors sm:text-[12px]">
              All destinations
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
