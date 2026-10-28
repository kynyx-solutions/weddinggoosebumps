import Link from "next/link";
import PostCard, { postCardImage } from "@/components/sections/post-card";
import { getRelatedPosts, postPath } from "@/lib/posts";

const GRID: Record<number, string> = {
  1: "max-w-md",
  2: "max-w-4xl md:grid-cols-2",
  3: "md:grid-cols-2 lg:grid-cols-3",
};

// "More celebrations" under a post: same destination first, then the newest. Nothing when the
// post is the only one.
export default async function PostRelated({ post }: { post: { id: string; destinationId: string | null } }) {
  const related = await getRelatedPosts(post);
  if (related.length === 0) return null;

  return (
    <section className="bg-white text-charcoal py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <div className="mb-12 text-center">
          <p className="font-commuter-sans text-charcoal/50 mb-4 text-[10px] tracking-[0.3em] uppercase sm:text-[11px]">
            Events
          </p>
          <h2 className="font-epicene-display text-[28px] leading-[1.1] font-light sm:text-[36px]">
            More Celebrations
          </h2>
        </div>
        {/* One or two cards sit centred rather than leaving empty columns */}
        <div className={`mx-auto grid grid-cols-1 gap-8 sm:gap-10 ${GRID[related.length] ?? GRID[3]}`}>
          {related.map((other) => (
            <PostCard
              key={other.id}
              href={`/events/${postPath(other.slug)}`}
              title={other.title}
              image={postCardImage(other)}
              imageAlt={other.coverAlt}
              date={other.publishDate ?? other.createdAt}
              excerpt={other.excerpt}
            />
          ))}
        </div>
        <div className="mt-14 text-center">
          <Link href="/inquire" className="inline-block">
            <span className="font-commuter-sans text-gold border-gold hover:border-gold/70 border-b-[1.4px] pb-1 text-[10px] tracking-[0.3em] uppercase transition-colors sm:text-[12px]">
              Plan something similar
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
