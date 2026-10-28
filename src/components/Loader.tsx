import Image from "next/image";

// Pre-sized 448px WebPs (transparent, so they sit on the ivory) served from public/ at fixed
// URLs: unlike bundled imports, their names don't change between `next dev` and `next build`,
// so a rebuild can't 404 them. Unoptimized and not `priority`, so they skip the optimizer and
// add no preload tags.
const slides = ["/loader/couple.webp", "/loader/jaimala.webp", "/loader/phere.webp"];
// Each slide's turn in the 2.7 s loop of .loader-slide (globals.css)
const SLIDE_MS = 900;

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#F8F5EF]">
      <div className="flex flex-col items-center">
        {/* All slides mount at once so every image downloads up front; only the current
            one is shown, so a swap never waits on the network */}
        <div className="relative h-44 w-44 md:h-56 md:w-56">
          {slides.map((src, i) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              unoptimized
              loading="eager"
              className="loader-slide object-contain"
              style={{ animationDelay: `${i * SLIDE_MS}ms` }}
            />
          ))}
        </div>

        <p className="mt-8 text-[13px] tracking-[0.4em] text-gray-700 uppercase">
          Wedding Goosebumps
        </p>
      </div>
    </div>
  );
}
