import React from "react";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import ServiceLevelSection from "@/components/sections/service-level";
import KindWords from "@/components/sections/kind-words";
import ReadingProgress from "@/components/blogSections/readingProgress";
import EventsHero from "@/components/sections/events-hero";

export const dynamic = "force-dynamic";

interface EventItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  publishDate: Date | null;
  createdAt: Date;
  sections: {
    content: unknown;
  }[];
}

export default async function EventsPage() {
  // Same list as the EVENTS dropdown in the navbar
  const events: EventItem[] = (await prisma.blogPost.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      coverImage: true,
      publishDate: true,
      createdAt: true,
      sections: {
        where: { section: "hero" },
        select: { content: true },
        take: 1,
      },
    },
  })) as unknown as EventItem[];

  const eventHref = (slug: string) => `/events/${slug.startsWith("/") ? slug.substring(1) : slug}`;
  const latestEvent = events[0]
    ? { title: events[0].title, href: eventHref(events[0].slug) }
    : null;

  return (
    <main className="bg-ivory text-charcoal">
      {/* Navbar */}
      <div className="relative z-50">
        <Navigation />
      </div>
      <ReadingProgress />

      <EventsHero latestEvent={latestEvent} />

      <section id="celebrations" className="scroll-mt-16 bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-5 sm:px-7">
          <div className="mb-16 text-center">
            <p className="font-commuter-sans text-charcoal/50 mb-4 text-[10px] tracking-[0.3em] uppercase sm:text-[11px]">
              Events
            </p>
            <h2 className="font-epicene-display mb-4 text-[32px] leading-[1.1] font-light sm:text-[42px] md:text-[50px]">
              Our Celebrations
            </h2>
            <p className="font-lora text-charcoal/80 mx-auto max-w-2xl text-[15px] sm:text-[17px]">
              Weddings, pre-wedding shoots and destination celebrations we have planned and
              captured.
            </p>
          </div>

          {events.length === 0 ? (
            <div className="text-charcoal/60 font-lora py-20 text-center">
              No events published yet. Check back soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event: EventItem) => {
                const hero = (event.sections[0]?.content ?? {}) as { heroImage?: string };
                const image = hero.heroImage || event.coverImage;

                return (
                  <Link key={event.id} href={eventHref(event.slug)} className="group block">
                    <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden bg-[#efe9df]">
                      {image ? (
                        <Image
                          src={image}
                          alt={event.title}
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
                      {new Intl.DateTimeFormat("en-IN", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(event.publishDate ?? event.createdAt)}
                    </p>
                    <h3 className="font-epicene-display mb-3 text-[22px] leading-[1.2] transition-colors group-hover:text-[#C2A770] sm:text-[24px]">
                      {event.title}
                    </h3>
                    {event.excerpt && (
                      <p className="font-lora text-charcoal/80 line-clamp-3 text-[14px] leading-[1.6]">
                        {event.excerpt}
                      </p>
                    )}
                    <span className="font-lora text-gold mt-4 inline-block text-[11px] tracking-[0.2em] uppercase">
                      View Event →
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <ServiceLevelSection />

      <KindWords />

      <Footer />
    </main>
  );
}
