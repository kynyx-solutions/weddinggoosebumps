import Link from "next/link";

// Only rendered for a logged-in admin viewing a post visitors can't see yet
export default function DraftPreviewBar({
  postId,
  status,
  publishDate,
}: {
  postId: string;
  status: string;
  publishDate: Date | null;
}) {
  const scheduled = status.toLowerCase() === "scheduled" && publishDate;
  const label = scheduled
    ? `Scheduled for ${new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }).format(publishDate)} IST`
    : "Draft";

  return (
    <div className="bg-charcoal fixed inset-x-0 bottom-0 z-[60] flex items-center justify-center gap-4 px-4 py-2.5 text-center text-[11px] tracking-[0.2em] text-white uppercase">
      <span>Preview · {label} · Not visible to visitors</span>
      <Link href={`/admin/blog/${postId}`} className="text-gold underline underline-offset-4">
        Edit
      </Link>
    </div>
  );
}
