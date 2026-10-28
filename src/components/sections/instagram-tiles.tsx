import Image from "next/image";
import { getContent } from "@/lib/content";

const PROFILE_URL = "https://www.instagram.com/weddinggoosebumps";

interface Tile {
  image: string;
  link: string;
  alt: string;
}

// Photos picked in Admin → Site Content → Instagram Tiles; renders nothing until there's one
export default async function InstagramTiles() {
  const { items } = await getContent<Tile>("instagram");
  if (items.length === 0) return null;

  return (
    <section className="bg-ivory text-charcoal pb-16 sm:pb-20 md:pb-24">
      <div className="mx-auto max-w-6xl px-5 text-center sm:px-8">
        <p className="font-commuter-sans text-gold text-[11px] font-bold tracking-[0.3em] uppercase sm:text-[13px]">
          From our Instagram
        </p>
        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-epicene-display hover:text-gold mt-3 inline-block text-[26px] leading-[1.1] font-light uppercase transition-colors sm:text-[34px]"
        >
          @weddinggoosebumps
        </a>
        <div className="mx-auto mt-5 h-[2px] w-14 bg-[#D9D5CF]" />

        <div className="mt-10 grid grid-cols-2 gap-2 sm:mt-12 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {items.map((tile) => (
            <a
              key={tile.id}
              href={tile.link || PROFILE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative block aspect-square overflow-hidden bg-[#efe9df]"
            >
              <Image
                src={tile.image}
                alt={tile.alt || "Wedding Goosebumps on Instagram"}
                fill
                sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            </a>
          ))}
        </div>

        <a
          href={PROFILE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-commuter-sans text-gold border-gold hover:border-gold/70 mt-10 inline-block border-b-[1.4px] pb-1 text-[10px] tracking-[0.3em] uppercase transition-colors sm:mt-12 sm:text-[12px]"
        >
          Follow us on Instagram
        </a>
      </div>
    </section>
  );
}
