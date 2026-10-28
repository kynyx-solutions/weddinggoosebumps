// The free-form "Story" written in the admin editor's Story tab. Posts without one render
// nothing, so they look exactly as before. Styles: .post-story in globals.css.
export default function PostStory({ html }: { html: string | null }) {
  const hasText = html ? html.replace(/<[^>]+>/g, "").trim().length > 0 : false;
  const hasMedia = html ? /<(img|iframe)\b/i.test(html) : false;
  if (!html || (!hasText && !hasMedia)) return null;

  return (
    <section className="bg-ivory text-charcoal pt-4 pb-16 sm:pb-20 lg:pb-24">
      <div
        className="post-story mx-auto max-w-[760px] px-5 sm:px-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </section>
  );
}
