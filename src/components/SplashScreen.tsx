"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// The logo screen shown when someone opens the site: on the loader's ivory background, once per
// visit (not on reloads in the same tab, and never in admin). It leaves as soon as the page has
// loaded, after at least MIN_MS so the logo doesn't just flash, and is gone MAX_MS after it first
// appeared at the latest. That limit is enforced in CSS (#wg-splash in globals.css), so a slow
// script can't hold it longer. The head script in app/layout.tsx decides before first paint
// whether it shows at all (and remembers that it has been seen).
const MIN_MS = 1200;
const MAX_MS = 3000;
const FADE_MS = 500;

export default function SplashScreen() {
  const [phase, setPhase] = useState<"shown" | "leaving" | "gone">("shown");
  const splashRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (document.documentElement.dataset.splash === "off") {
      setPhase("gone");
      return;
    }

    // How long the logo has been on screen: its CSS fade-out animation started when it appeared
    // (the page may arrive well after it was opened), so time everything from that
    const shownFor = () => {
      const fadeOut = splashRef.current
        ?.getAnimations?.()
        .find((a) => (a as CSSAnimation).animationName === "wg-splash-out");
      return typeof fadeOut?.currentTime === "number" ? fadeOut.currentTime : performance.now();
    };
    const latestFade = MAX_MS - FADE_MS;
    let leaveTimer: number | undefined;
    const leave = () => {
      // In its last half second the CSS fade is already running; the cap below ends it
      if (shownFor() < latestFade) setPhase("leaving");
    };
    const onLoad = () => {
      leaveTimer = window.setTimeout(leave, Math.max(0, MIN_MS - shownFor()));
    };
    const cap = window.setTimeout(() => setPhase("gone"), Math.max(0, MAX_MS - shownFor()));

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      window.clearTimeout(cap);
      window.clearTimeout(leaveTimer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = window.setTimeout(() => setPhase("gone"), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === "gone") return null;

  return (
    <div
      id="wg-splash"
      ref={splashRef}
      aria-hidden="true"
      className={`fixed inset-0 z-[10000] flex items-center justify-center bg-[#F8F5EF] ${
        phase === "leaving" ? "wg-splash-leaving" : ""
      }`}
    >
      <div className="wg-splash-logo relative h-60 w-60 md:h-72 md:w-72">
        <Image
          src="/loader/wedding-goosebumps-logo.webp"
          alt=""
          fill
          unoptimized
          loading="eager"
          fetchPriority="high"
          className="object-contain"
        />
      </div>
    </div>
  );
}
