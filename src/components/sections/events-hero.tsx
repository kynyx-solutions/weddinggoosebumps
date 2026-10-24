"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Each set fills the three panels (left, centre, right); centre frames are picked
// for open space behind the headline, and only the centre panel shows on mobile.
const SETS = [
  ["/gallery/BB_02895.jpg", "/gallery/DSC07473.jpg", "/gallery/DSC08363.jpg"],
  ["/gallery/DSC05495.jpg", "/gallery/DSC07927.jpg", "/offerings-page/slide-section/Photo-11.jpg"],
  ["/gallery/DEV06384.jpg", "/gallery/DSC07748 (1).jpg", "/offerings-page/slide-section/Photo-7.jpg"],
];

const ALTS = [
  ["Couple taking their pheras", "Groom's entry under cold pyros", "Bride at a white floral arch"],
  ["Bride at her haldi ceremony", "Floral mandap with the bride", "Couple at a cocktail evening"],
  ["Varmala under a shower of petals", "Baraat at a palace venue", "Floral staircase decor"],
];

const INTERVAL = 6500;
const PANEL_STAGGER = 300; // ms between panels, so each change sweeps left to right

interface EventsHeroProps {
  latestEvent?: { title: string; href: string } | null;
}

export default function EventsHero({ latestEvent }: EventsHeroProps) {
  const [active, setActive] = useState(0);
  const [autoplay, setAutoplay] = useState(false);

  // Only rotate for visitors who haven't asked for reduced motion
  useEffect(() => {
    setAutoplay(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Timer restarts whenever the set changes, so a manual pick gets a full interval
  useEffect(() => {
    if (!autoplay) return;
    const id = setTimeout(() => setActive((i) => (i + 1) % SETS.length), INTERVAL);
    return () => clearTimeout(id);
  }, [active, autoplay]);

  return (
    <section className="bg-charcoal relative h-[85vh] min-h-[560px] w-full overflow-hidden lg:h-[100vh]">
      {/* — Triptych: three panels on desktop, centre panel only on mobile */}
      <div className="absolute inset-0 grid grid-cols-1 md:grid-cols-3">
        {[0, 1, 2].map((panel) => (
          <div
            key={panel}
            className={`relative overflow-hidden ${panel === 1 ? "" : "hidden md:block"}`}
          >
            {SETS.map((set, si) => (
              <Image
                key={set[panel]}
                src={set[panel]}
                alt={ALTS[si][panel]}
                fill
                sizes="(min-width: 768px) 34vw, 100vw"
                priority={si === 0}
                className={`object-cover ${
                  si === active ? "opacity-100 motion-safe:scale-[1.08]" : "scale-100 opacity-0"
                }`}
                style={{
                  // Tailwind v4 scale-* sets the `scale` property, not `transform`
                  transitionProperty: "opacity, scale",
                  transitionDuration: "1.6s, 9s",
                  transitionTimingFunction: "ease-in-out, ease-out",
                  transitionDelay: `${panel * PANEL_STAGGER}ms, 0ms`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      {/* — Scrim + soft centre vignette so the type stays legible on any frame */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/55" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.28)_0%,transparent_65%)]" />

      {/* — Headline */}
      <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
        <div className="drop-shadow-[0_2px_14px_rgba(0,0,0,0.25)]">
          <p className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 mb-3 text-[11px] tracking-[0.35em] text-white/85 uppercase duration-1000 fill-mode-both">
            Explore our
          </p>
          <h1 className="font-epicene-display motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 mb-0 text-[38px] leading-tight tracking-[0.04em] text-white/95 uppercase duration-1000 fill-mode-both delay-150 sm:text-[52px] md:text-[64px] lg:text-[76px]">
            Events
          </h1>

          <div className="motion-safe:animate-in motion-safe:fade-in mx-auto my-5 h-px w-16 bg-white/60 duration-1000 fill-mode-both delay-300 sm:my-6 sm:w-20" />

          <p className="font-lora motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 mx-auto mb-7 max-w-[34ch] text-[14px] leading-[1.7] text-white/90 duration-1000 fill-mode-both delay-500 sm:mb-9 sm:max-w-[46ch] sm:text-[16px]">
            From haldi mornings to starlit pheras —{" "}
            <em className="italic">celebrations designed to give you goosebumps.</em>
          </p>

          <a
            href="#celebrations"
            className="motion-safe:animate-in motion-safe:fade-in inline-block duration-1000 fill-mode-both delay-700"
          >
            <span className="font-commuter-sans hover:border-gold hover:text-gold border-b-[1.4px] border-white/80 pb-1 text-[10px] tracking-[0.3em] text-white uppercase transition-colors duration-300 sm:text-[11px]">
              View Celebrations
            </span>
          </a>
        </div>
      </div>

      {/* — Latest celebration (desktop) */}
      {latestEvent && (
        <Link
          href={latestEvent.href}
          className="group absolute bottom-8 left-6 hidden max-w-[240px] md:left-10 md:block lg:bottom-10 lg:left-16 lg:max-w-[320px]"
        >
          <span className="font-commuter-sans block text-[10px] tracking-[0.3em] text-white/70 uppercase">
            Latest celebration
          </span>
          <span className="font-cormorant group-hover:text-gold mt-1 block text-[20px] leading-snug text-white transition-colors duration-300">
            {latestEvent.title} <span aria-hidden="true">→</span>
          </span>
        </Link>
      )}

      {/* — Scroll cue */}
      <a
        href="#celebrations"
        aria-label="Scroll to celebrations"
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 sm:flex lg:bottom-8"
      >
        <span className="font-commuter-sans text-[9px] tracking-[0.35em] text-white/70 uppercase">
          Scroll
        </span>
        <span className="relative h-10 w-px overflow-hidden bg-white/25">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-white motion-safe:animate-[scroll-cue_2.2s_ease-in-out_infinite]" />
        </span>
      </a>

      {/* — Set indicators */}
      <div className="absolute right-6 bottom-8 flex items-center gap-4 md:right-10 lg:right-16 lg:bottom-10">
        <span className="font-cormorant text-[15px] tracking-[0.1em] text-white/85 tabular-nums">
          {String(active + 1).padStart(2, "0")}
          <span className="mx-1.5 text-white/40">/</span>
          {String(SETS.length).padStart(2, "0")}
        </span>
        <div className="flex items-center gap-2">
          {SETS.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show photo set ${i + 1}`}
              aria-current={i === active}
              className="py-3"
            >
              <span
                className={`relative block h-px overflow-hidden bg-white/35 transition-all duration-500 ${
                  i === active ? "w-12" : "w-6 hover:bg-white/70"
                }`}
              >
                {i === active && (
                  <span
                    key={active}
                    className={`absolute inset-0 bg-white ${
                      autoplay ? "animate-in slide-in-from-left-full ease-linear fill-mode-both" : ""
                    }`}
                    style={autoplay ? { animationDuration: `${INTERVAL}ms` } : undefined}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
