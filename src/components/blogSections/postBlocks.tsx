import Image from "next/image";
import Link from "next/link";
import { isBlockFilled, videoEmbedUrl, type Block } from "@/lib/blocks";

function GalleryBlock({ images }: { images: { src: string; alt: string }[] }) {
  if (images.length === 1) {
    return (
      <div className="relative mx-auto aspect-[16/10] w-full max-w-5xl overflow-hidden bg-[#efe9df]">
        <Image src={images[0].src} alt={images[0].alt} fill sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
      </div>
    );
  }
  return (
    <div className="mx-auto grid max-w-6xl grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-3">
      {images.map((image) => (
        <div key={image.src} className="relative aspect-[3/4] overflow-hidden bg-[#efe9df]">
          <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
        </div>
      ))}
    </div>
  );
}

function BlockView({ block }: { block: Block }) {
  switch (block.type) {
    case "gallery":
      return <GalleryBlock images={block.images.filter((image) => image.src)} />;

    case "film":
      return (
        <figure className="mx-auto max-w-4xl">
          <iframe
            src={videoEmbedUrl(block.url)!}
            title={block.caption || "Wedding film"}
            className="aspect-video w-full border-0"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {block.caption && (
            <figcaption className="font-lora text-charcoal/70 mt-4 text-center text-[14px] italic">{block.caption}</figcaption>
          )}
        </figure>
      );

    case "facts": {
      const items = block.items.filter((item) => item.value.trim());
      return (
        <div className="mx-auto max-w-5xl bg-white px-5 py-12 sm:py-14">
          <p className="font-commuter-sans text-gold text-center text-[11px] font-bold tracking-[0.3em] uppercase sm:text-[12px]">
            At a glance
          </p>
          <div className="mx-auto mt-4 h-[2px] w-12 bg-[#D9D5CF]" />
          <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))]">
            {items.map((item) => (
              <div key={item.label} className="flex flex-col items-center text-center">
                <dt className="font-commuter-sans text-charcoal/60 order-2 mt-3 text-[10px] tracking-[0.3em] uppercase sm:text-[11px]">
                  {item.label}
                </dt>
                <dd className="font-epicene-display order-1 text-[24px] leading-[1.15] sm:text-[30px]">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      );
    }

    case "quote":
      return (
        <blockquote className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-8 h-[2px] w-12 bg-[#C2A770]" />
          <p className="font-cormorant text-[24px] leading-[1.35] font-light italic sm:text-[32px]">
            &ldquo;{block.text}&rdquo;
          </p>
          {block.author && (
            <footer className="font-commuter-sans text-charcoal/60 mt-6 text-[10px] tracking-[0.3em] uppercase sm:text-[11px]">
              {block.author}
            </footer>
          )}
        </blockquote>
      );

    case "button":
      return (
        <div className="text-center">
          <Link
            href={block.href}
            className="text-charcoal inline-block bg-[#dedad3] px-6 py-3 text-[10px] font-normal tracking-[0.2em] uppercase transition-colors duration-300 hover:bg-[#d4cdc4] sm:px-8 sm:py-4 sm:text-[11px] md:px-10 md:py-5 md:text-xs"
          >
            {block.label}
          </Link>
        </div>
      );

    case "faq": {
      const items = block.items.filter((item) => item.question.trim() && item.answer.trim());
      return (
        <div className="border-charcoal/15 divide-charcoal/15 mx-auto max-w-3xl divide-y border-y">
          {items.map((item) => (
            <details key={item.question} className="group py-5 sm:py-6">
              <summary className="font-lora flex cursor-pointer list-none items-start justify-between gap-6 text-[15px] leading-[1.6] sm:text-[17px] [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span className="text-gold mt-0.5 shrink-0 text-[22px] leading-none font-light transition-transform duration-300 group-open:rotate-45" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="font-lora text-charcoal/80 mt-4 mb-0 pr-10 text-[14px] leading-[1.85] whitespace-pre-line sm:text-[15px]">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      );
    }
  }
}

// The post's extra blocks, in the order set in the editor; empty blocks are skipped
export default function PostBlocks({ blocks }: { blocks: Block[] | undefined }) {
  const filled = (blocks ?? []).filter(isBlockFilled);
  if (filled.length === 0) return null;

  return (
    <div className="bg-ivory text-charcoal space-y-16 px-5 pb-16 sm:space-y-20 sm:px-8 sm:pb-20">
      {filled.map((block) => (
        <section key={block.id}>
          <BlockView block={block} />
        </section>
      ))}
    </div>
  );
}
