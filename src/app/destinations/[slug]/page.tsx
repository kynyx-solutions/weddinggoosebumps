import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import PostCard, { postCardImage } from "@/components/sections/post-card";
import { getDestination, lines } from "@/lib/destinations";
import { getLivePosts, postPath } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

function Detail({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-commuter-sans text-gold text-[11px] font-bold tracking-[0.3em] uppercase sm:text-[12px]">
        {title}
      </p>
      <div className="mt-3 mb-5 h-[2px] w-12 bg-[#D9D5CF]" />
      {children}
    </div>
  );
}

export default async function DestinationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) notFound();

  const posts = (await getLivePosts()).filter((post) => post.destinationId === destination.id);
  const highlights = lines(destination.highlights);
  const venues = lines(destination.venues);
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Destinations", item: `${SITE_URL}/destinations` },
      { "@type": "ListItem", position: 3, name: destination.name, item: `${SITE_URL}/destinations/${destination.slug}` },
    ],
  };

  return (
    <main className="bg-ivory text-charcoal">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs).replace(/</g, "\\u003c") }}
      />
      <div className="relative z-50">
        <Navigation />
      </div>

      {destination.heroImage ? (
        <section className="relative h-[75vh] w-full overflow-hidden lg:h-[90vh]">
          <Image src={destination.heroImage} alt={destination.name} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/55" />
          <div className="absolute inset-x-0 bottom-0 px-5 pb-16 text-center text-white sm:pb-20">
            {destination.region && (
              <p className="font-commuter-sans mb-4 text-[10px] tracking-[0.4em] uppercase sm:text-[12px]">
                {destination.region}
              </p>
            )}
            <h1 className="font-epicene-display text-[34px] leading-[1.05] font-light text-white uppercase drop-shadow sm:text-[48px] md:text-[60px]">
              {destination.name}
            </h1>
            {destination.tagline && (
              <p className="font-lora mt-4 text-[15px] italic sm:text-[18px]">{destination.tagline}</p>
            )}
          </div>
        </section>
      ) : (
        <section className="bg-white pt-28 pb-12 text-center sm:pt-36">
          {destination.region && (
            <p className="font-commuter-sans text-charcoal/60 mb-4 text-[11px] tracking-[0.4em] uppercase">
              {destination.region}
            </p>
          )}
          <h1 className="font-epicene-display text-[34px] leading-[1.05] font-light uppercase sm:text-[48px]">
            {destination.name}
          </h1>
          {destination.tagline && <p className="font-lora mt-4 text-[16px] italic">{destination.tagline}</p>}
        </section>
      )}

      {destination.intro && (
        <section className="py-16 sm:py-20 md:py-24">
          <div className="mx-auto max-w-[760px] px-5 text-center sm:px-8">
            <p className="font-commuter-sans text-charcoal/60 mb-4 text-[10px] tracking-[0.4em] uppercase sm:text-[11px]">
              The Destination
            </p>
            <p className="font-lora text-charcoal/85 text-[15px] leading-[1.9] whitespace-pre-line sm:text-[17px]">
              {destination.intro}
            </p>
          </div>
        </section>
      )}

      {(destination.bestSeason || highlights.length > 0 || venues.length > 0) && (
        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto grid max-w-6xl gap-12 px-5 sm:px-8 md:grid-cols-3">
            {destination.bestSeason && (
              <Detail title="Best season">
                <p className="font-cormorant text-[24px] leading-[1.2] font-light sm:text-[28px]">{destination.bestSeason}</p>
              </Detail>
            )}
            {highlights.length > 0 && (
              <Detail title="Why celebrate here">
                <ul className="font-lora text-charcoal/85 space-y-3 text-[15px] leading-[1.7]">
                  {highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Detail>
            )}
            {venues.length > 0 && (
              <Detail title="Venues we love">
                <ul className="font-lora text-charcoal/85 space-y-3 text-[15px] leading-[1.7]">
                  {venues.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Detail>
            )}
          </div>
        </section>
      )}

      {posts.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-6xl px-5 sm:px-7">
            <h2 className="font-epicene-display mb-12 text-center text-[28px] leading-[1.1] font-light sm:text-[36px]">
              Celebrations in {destination.name}
            </h2>
            <div
              className={`mx-auto grid grid-cols-1 gap-8 sm:gap-10 ${
                posts.length === 1 ? "max-w-md" : posts.length === 2 ? "max-w-4xl md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"
              }`}
            >
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  href={`/events/${postPath(post.slug)}`}
                  title={post.title}
                  image={postCardImage(post)}
                  date={post.publishDate ?? post.createdAt}
                  excerpt={post.excerpt}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-white py-16 text-center sm:py-24">
        <div className="mx-auto max-w-2xl px-5">
          <h2 className="font-epicene-display text-[26px] leading-[1.15] font-light uppercase sm:text-[34px]">
            Your {destination.name} wedding
          </h2>
          <div className="mx-auto mt-5 h-[2px] w-14 bg-[#D9D5CF]" />
          <Link
            href="/inquire"
            className="text-charcoal mt-10 inline-block bg-[#dedad3] px-6 py-3 text-[10px] font-normal tracking-[0.2em] uppercase transition-colors duration-300 hover:bg-[#d4cdc4] sm:px-8 sm:py-4 sm:text-[11px] md:px-10 md:py-5 md:text-xs"
          >
            Inquire to begin your experience
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const destination = await getDestination(slug);
  if (!destination) return {};
  const description =
    destination.metaDescription ||
    [destination.tagline, destination.intro?.slice(0, 150)].filter(Boolean).join(". ") ||
    undefined;

  return {
    title: destination.metaTitle || `${destination.name} Destination Weddings`,
    description,
    alternates: { canonical: `${SITE_URL}/destinations/${destination.slug}` },
    openGraph: {
      title: destination.metaTitle || `${destination.name} Destination Weddings`,
      description,
      images: destination.heroImage ? [destination.heroImage] : [],
    },
  };
}
