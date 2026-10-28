import Image from "next/image";
import Link from "next/link";

const dateFormat = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

// Same card as the Events listing, for "More celebrations" and destination pages
export default function PostCard({
  href,
  title,
  image,
  imageAlt,
  date,
  excerpt,
}: {
  href: string;
  title: string;
  image: string | null;
  imageAlt?: string | null;
  date: Date;
  excerpt?: string | null;
}) {
  return (
    <Link href={href} className="group block">
      <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden bg-[#efe9df]">
        {image ? (
          <Image
            src={image}
            alt={imageAlt || title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="font-epicene-display absolute inset-0 flex items-center justify-center text-4xl text-[#B5A484]/30">
            WG
          </div>
        )}
      </div>
      <p className="font-commuter-sans text-charcoal/50 mb-2 text-[9px] tracking-[0.2em] uppercase sm:text-[10px]">
        {dateFormat.format(date)}
      </p>
      <h3 className="font-epicene-display mb-3 text-[22px] leading-[1.2] transition-colors group-hover:text-[#C2A770] sm:text-[24px]">
        {title}
      </h3>
      {excerpt && (
        <p className="font-lora text-charcoal/80 line-clamp-3 text-[14px] leading-[1.6]">{excerpt}</p>
      )}
      <span className="font-lora text-gold mt-4 inline-block text-[11px] tracking-[0.2em] uppercase">
        View Event →
      </span>
    </Link>
  );
}

// The picture a post shows on cards: its hero image, else the cover
export function postCardImage(post: { coverImage: string | null; sections: { content: unknown }[] }) {
  const hero = (post.sections[0]?.content ?? {}) as { heroImage?: string };
  return hero.heroImage || post.coverImage;
}
