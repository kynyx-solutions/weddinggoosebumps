import React from "react";
import { notFound } from "next/navigation";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import BlogHero from "@/components/blogSections/blogHero";
import BlogJournal from "@/components/blogSections/blogJournal";
import BlogServices from "@/components/blogSections/blogServices";
import BlogKindWords from "@/components/blogSections/blogKindWords";
import PostStory from "@/components/blogSections/postStory";
import PostBlocks from "@/components/blogSections/postBlocks";
import PostRelated from "@/components/blogSections/postRelated";
import PostFooter from "@/components/blogSections/postFooter";
import type { Block } from "@/lib/blocks";
import PostJsonLd from "@/components/blogSections/postJsonLd";
import DraftPreviewBar from "@/components/blogSections/draftPreviewBar";
import { auth } from "@/lib/auth";
import { getPostBySlug, isLive, postMetadata, readingTime, sectionContent } from "@/lib/posts";

export const dynamic = "force-dynamic";

// Keeps the route loader up for one full round of its three illustrations (3 × 900 ms)
const LOADER_HOLD_MS = 2700;

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  await new Promise((resolve) => setTimeout(resolve, LOADER_HOLD_MS));
  const { slug } = await params;

  const finalPost = await getPostBySlug(slug);
  if (!finalPost) {
    notFound();
  }

  // Drafts and not-yet-due scheduled posts are visible only to logged-in admins, as a preview
  const live = isLive(finalPost);
  if (!live && !(await auth())?.user) {
    notFound();
  }

  const heroContent = sectionContent<{
    category: string;
    heroImage: string;
  }>(finalPost, "hero");

  const journalContent = sectionContent<{
    heading: string;
    paragraph: string;
    authorName: string;
    authorRole: string;
    authorImage: string;
  }>(finalPost, "journal");
  const journalData = {
    heading: journalContent.heading || "A Session Made for Two",

    paragraph: journalContent.paragraph || finalPost.excerpt || "",

    author: {
      name: journalContent.authorName || "Ali Waris Khan",

      role: journalContent.authorRole || "Founder & Creative Director",

      avatar: journalContent.authorImage || "/about-page/slide2/Photo.jpg",
    },
  };

  const heroData = {
    category: heroContent.category || "",
    title: finalPost.title,
    dek: finalPost.excerpt || "",
    author: journalData.author,
    date: new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(finalPost.publishDate ?? finalPost.createdAt),

    readTime: readingTime(finalPost),
    hero: heroContent.heroImage || finalPost.coverImage || "",
    tags: [],
  };

  const serviceContent = sectionContent<{
    heading: string;
    paragraph: string;
    image: string;
  }>(finalPost, "service");

  const kindWords = sectionContent<{
    heading: string;
    subheading: string;
    paragraph: string;
    smallImage: string;
    bigImage: string;
  }>(finalPost, "kindWords");

  return (
    <main className="bg-ivory text-charcoal">
      <PostJsonLd post={finalPost} image={heroData.hero} authorName={journalData.author.name} />
      {/* Navbar */}
      <div className="relative z-50">
        <Navigation eventTitle={finalPost.title} />
      </div>
      <BlogHero ART={heroData} />
      {/* Section 2 — centered eyebrow + heading + intro copy, mirrors "WE CREATE / UNFORGETTABLE EXPERIENCES" */}
      <BlogJournal ART={journalData} />
      <BlogServices service={serviceContent} />
      {/* Section 3 — two-image row, mirrors the about-page gallery pair */}
      <BlogKindWords kindWords={kindWords} />
      <PostStory html={finalPost.body} />
      <PostBlocks blocks={sectionContent<{ blocks: Block[] }>(finalPost, "blocks").blocks} />
      <PostFooter post={finalPost} image={heroData.hero} author={heroData.author} />
      <PostRelated post={finalPost} />
      <div className="mx-auto max-w-7xl py-10">
        <div className="h-[5px] rounded-full bg-gradient-to-r from-transparent via-gray-300 to-transparent" />
      </div>

      <Footer />
      {!live && (
        <DraftPreviewBar
          postId={finalPost.id}
          status={finalPost.status}
          publishDate={finalPost.publishDate}
        />
      )}
    </main>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  // A visitor opening a draft's address learns nothing about it, not even its title
  if (post && !isLive(post) && !(await auth())?.user) return {};
  return postMetadata(post);
}
