"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Pre-sized 448px WebPs served from public/ at fixed URLs: unlike bundled imports, their
// names don't change between `next dev` and `next build`, so a rebuild can't 404 them.
// Unoptimized and not `priority`, so they skip the optimizer and add no preload tags.
const slides = ["/loader/couple.webp", "/loader/jaimala.webp", "/loader/phere.webp"];

export default function Loader() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 900);

    return () => clearInterval(interval);
  }, []);

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
              className={`object-contain ${i === index ? "animate-fade" : "opacity-0"}`}
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
