import Image from "next/image";
import Link from "next/link";
import { Facebook } from "lucide-react";
import CopyLinkButton from "./copyLinkButton";
import { WHATSAPP_ICON_PATH } from "@/lib/whatsapp";
import { getContent } from "@/lib/content";
import { canonicalPostUrl, getAdjacentPosts, postPath } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

const iconClass = "text-charcoal/70 rounded p-2 transition-colors duration-200 hover:text-[#C2A770]";

interface Author {
  name: string;
  role: string;
  photo: string;
  bio: string;
}

// Under a post: share links, "About the author" (when that author has a bio under Site Content →
// Authors) and the older / newer post
export default async function PostFooter({
  post,
  image,
  author,
}: {
  post: { id: string; title: string; slug: string; canonicalUrl: string | null };
  image: string;
  author: { name: string; role: string; avatar: string };
}) {
  const url = canonicalPostUrl(post);
  const [{ older, newer }, { items: authors }] = await Promise.all([
    getAdjacentPosts(post.id),
    getContent<Author>("author"),
  ]);
  const profile = authors.find((a) => a.name.trim().toLowerCase() === author.name.trim().toLowerCase());
  const media = image.startsWith("/") ? `${SITE_URL}${image}` : image;

  return (
    <section className="bg-ivory text-charcoal pb-16 sm:pb-20">
      <div className="mx-auto max-w-[760px] px-5 sm:px-8">
        <div className="border-charcoal/15 flex flex-col items-center gap-3 border-t pt-10 text-center">
          <p className="font-commuter-sans text-charcoal/60 text-[10px] tracking-[0.3em] uppercase sm:text-[11px]">
            Share this celebration
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on WhatsApp"
              className={iconClass}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d={WHATSAPP_ICON_PATH} />
              </svg>
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Share on Facebook"
              className={iconClass}
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href={`https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(media)}&description=${encodeURIComponent(post.title)}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Save on Pinterest"
              className={iconClass}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
              </svg>
            </a>
            <CopyLinkButton url={url} className={iconClass} />
          </div>
        </div>

        {profile?.bio && (
          <div className="mt-12 flex flex-col items-center gap-5 bg-white px-6 py-10 text-center sm:flex-row sm:items-start sm:px-10 sm:text-left">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[#efe9df]">
              <Image src={profile.photo || author.avatar} alt={profile.name} fill sizes="80px" className="object-cover" />
            </div>
            <div>
              <p className="font-commuter-sans text-gold text-[10px] font-bold tracking-[0.3em] uppercase sm:text-[11px]">
                About the author
              </p>
              <p className="font-cormorant mt-2 text-[20px] font-light uppercase">{profile.name}</p>
              {profile.role && (
                <p className="font-commuter-sans text-charcoal/55 text-[10px] tracking-[0.08em] uppercase sm:text-[11px]">
                  {profile.role}
                </p>
              )}
              <p className="font-lora text-charcoal/80 mt-3 mb-0 text-[14px] leading-[1.8] sm:text-[15px]">{profile.bio}</p>
            </div>
          </div>
        )}

        {(older || newer) && (
          <nav className="mt-12 grid grid-cols-2 gap-6" aria-label="More posts">
            <div>
              {older && (
                <Link href={`/events/${postPath(older.slug)}`} className="group block">
                  <p className="font-commuter-sans text-charcoal/50 text-[10px] tracking-[0.25em] uppercase">← Previous</p>
                  <p className="font-cormorant group-hover:text-gold mt-2 text-[17px] leading-snug transition-colors sm:text-[20px]">
                    {older.title}
                  </p>
                </Link>
              )}
            </div>
            <div className="text-right">
              {newer && (
                <Link href={`/events/${postPath(newer.slug)}`} className="group block">
                  <p className="font-commuter-sans text-charcoal/50 text-[10px] tracking-[0.25em] uppercase">Next →</p>
                  <p className="font-cormorant group-hover:text-gold mt-2 text-[17px] leading-snug transition-colors sm:text-[20px]">
                    {newer.title}
                  </p>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </section>
  );
}
