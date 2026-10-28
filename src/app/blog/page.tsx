import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getLivePosts } from "@/lib/posts";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";

const PER_PAGE = 12;

function pageHref(params: { category?: string; q?: string; page?: number }) {
  const search = new URLSearchParams();
  if (params.category) search.set("category", params.category);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));
  const query = search.toString();
  return query ? `/blog?${query}` : "/blog";
}

export const dynamic = "force-dynamic";

export default async function BlogListingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { category, q, page: pageParam } = await searchParams;
  const allPosts = await getLivePosts();
  const query = (q ?? "").trim().slice(0, 100);

  // Categories that have at least one published post, for the filter chips
  const categories = [
    ...new Map(allPosts.flatMap((post) => post.categories.map((c) => [c.category.slug, c.category]))).values(),
  ].sort((a, b) => a.name.localeCompare(b.name));

  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const filtered = allPosts.filter((post) => {
    if (category && !post.categories.some((c) => c.category.slug === category)) return false;
    const haystack = `${post.title} ${post.excerpt ?? ""}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), pageCount);
  const posts = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const chipClass = (active: boolean) =>
    `font-commuter-sans border-b-[1.4px] pb-1 text-[10px] tracking-[0.3em] uppercase transition-colors sm:text-[11px] ${
      active ? "text-gold border-gold" : "text-charcoal/60 hover:text-charcoal border-transparent"
    }`;

  return (
    <main className="bg-ivory text-charcoal min-h-screen">
      <div className="relative z-50">
        <Navigation />
      </div>

      <section className="bg-white pt-24 pb-16 sm:pt-32 sm:pb-24">
        <div className="mx-auto max-w-5xl px-5 sm:px-7">
          <div className="mb-16 text-center">
            <h1 className="font-epicene-display mb-4 text-[32px] leading-[1.1] font-light sm:text-[42px] md:text-[50px]">
              Journal
            </h1>
            <p className="font-lora text-charcoal/80 mx-auto max-w-2xl text-[15px] sm:text-[17px]">
              Stories, inspiration, and insights from our latest celebrations around the world.
            </p>
          </div>

          {allPosts.length > 0 && (
            <div className="mb-14 flex flex-col items-center gap-8">
              {categories.length > 0 && (
                <nav aria-label="Categories" className="flex flex-wrap justify-center gap-x-6 gap-y-3">
                  <Link href={pageHref({ q: query })} className={chipClass(!category)}>
                    All
                  </Link>
                  {categories.map((c) => (
                    <Link key={c.slug} href={pageHref({ category: c.slug, q: query })} className={chipClass(category === c.slug)}>
                      {c.name}
                    </Link>
                  ))}
                </nav>
              )}
              <form action="/blog" className="w-full max-w-sm">
                {category && <input type="hidden" name="category" value={category} />}
                <label htmlFor="journal-search" className="sr-only">
                  Search the journal
                </label>
                <input
                  id="journal-search"
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Search the journal"
                  className="font-lora w-full border-b border-gray-400 bg-transparent py-2 text-center text-[15px] focus:outline-none"
                />
              </form>
            </div>
          )}

          {posts.length === 0 ? (
            <div className="text-charcoal/60 font-lora py-20 text-center">
              {allPosts.length === 0
                ? "No journal entries published yet. Check back soon."
                : "Nothing matches that search."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/blog${post.slug.startsWith("/") ? post.slug : `/${post.slug}`}`}
                  className="group block"
                >
                  <div className="relative mb-5 aspect-[4/3] w-full overflow-hidden bg-[#efe9df]">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.coverAlt || post.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="font-epicene-display absolute inset-0 flex items-center justify-center text-4xl text-[#B5A484]/30">
                        WG
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-commuter-sans text-charcoal/50 mb-2 text-[9px] tracking-[0.2em] uppercase sm:text-[10px]">
                      {post.publishDate
                        ? new Date(post.publishDate).toLocaleDateString()
                        : new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    <h2 className="font-epicene-display mb-3 text-[22px] leading-[1.2] transition-colors group-hover:text-[#C2A770] sm:text-[24px]">
                      {post.title}
                    </h2>
                    {post.excerpt && (
                      <p className="font-lora text-charcoal/80 line-clamp-3 text-[14px] leading-[1.6]">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
          {pageCount > 1 && (
            <nav aria-label="Pages" className="mt-16 flex items-center justify-center gap-8">
              {page > 1 ? (
                <Link href={pageHref({ category, q: query, page: page - 1 })} className={chipClass(false)}>
                  ← Newer
                </Link>
              ) : (
                <span />
              )}
              <span className="font-commuter-sans text-charcoal/50 text-[10px] tracking-[0.3em] uppercase sm:text-[11px]">
                Page {page} of {pageCount}
              </span>
              {page < pageCount ? (
                <Link href={pageHref({ category, q: query, page: page + 1 })} className={chipClass(false)}>
                  Older →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}

export const metadata = {
  title: "Journal | Wedding Goosebumps",
  description: "Stories, inspiration, and insights from our latest celebrations around the world.",
};
