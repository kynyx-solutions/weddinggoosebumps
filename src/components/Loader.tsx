"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
// Bundled with the code (hashed, cached forever) and pre-sized to 448px, so they
// skip the image optimizer and don't add <link rel="preload"> tags to every page
import couple from "./loader/couple.webp";
import jaimala from "./loader/jaimala.webp";
import phere from "./loader/phere.webp";

const slides = [couple, jaimala, phere];

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
        <div className="relative h-44 w-44 md:h-56 md:w-56">
          <Image
            key={slides[index].src}
            src={slides[index]}
            alt=""
            fill
            unoptimized
            loading="eager"
            className="animate-fade object-contain"
          />
        </div>

        <p className="mt-8 text-[13px] tracking-[0.4em] text-gray-700 uppercase">
          Wedding Goosebumps
        </p>
      </div>
    </div>
  );
}
