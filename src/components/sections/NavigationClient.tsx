"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Ellipsis, Menu, X } from "lucide-react";
import WhatsAppButton from "./whatsapp-button";

interface NavigationClientProps {
  eventLinks: {
    title: string;
    slug: string;
  }[];
  whatsappHref: string;
}

const navLinks = [
  { name: "HOME", href: "/" },
  { name: "ABOUT", href: "/about" },
  { name: "OFFERINGS", href: "/offerings" },
  { name: "GALLERIES", href: "/galleries" },
  { name: "INQUIRE", href: "/inquire" },
  
];


const LOGO_URL = "/logo/Logo.png";

export default function NavigationClient({ eventLinks, whatsappHref }: NavigationClientProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHeroMenuOpen, setIsHeroMenuOpen] = useState(false);
  const [heroEventsOpen, setHeroEventsOpen] = useState(false);
  const heroMenuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    handleScroll(); // page may load already scrolled (refresh, back navigation)
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
    setIsHeroMenuOpen(false);
  }, [pathname]);

  // The hero dropdown belongs to the top of the page; it closes once the header takes over
  useEffect(() => {
    if (isVisible) setIsHeroMenuOpen(false);
  }, [isVisible]);

  // Close the hero dropdown on an outside click/tap or Escape
  useEffect(() => {
    if (!isHeroMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!heroMenuRef.current?.contains(e.target as Node)) setIsHeroMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsHeroMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isHeroMenuOpen]);

  useEffect(() => {
    // Lock only vertical scroll without touching global horizontal overflow clamp
    const body = document.body;
    if (isMenuOpen) {
      body.classList.add("scroll-lock");
    } else {
      body.classList.remove("scroll-lock");
    }
    return () => body.classList.remove("scroll-lock");
  }, [isMenuOpen]);

  const [eventsOpen, setEventsOpen] = useState(false);

  // The dots trigger sits over the hero while the header is still hidden
  const showHeroTrigger = !isVisible && !isMenuOpen;
  const heroMenuOpen = isHeroMenuOpen && showHeroTrigger;

  return (
    <>
      {/* Hero menu — dots trigger plus a panel that drops from the top-right corner */}
      <div
        aria-hidden={!showHeroTrigger}
        className={`pointer-events-none fixed inset-x-0 top-0 z-40 transition-opacity duration-500 ease-in-out ${
          showHeroTrigger ? "opacity-100" : "opacity-0"
        }`}
      >
        <div ref={heroMenuRef} className="relative mx-auto max-w-[1700px]">
          <div
            className={`bg-ivory absolute top-0 right-0 w-full border-b border-[#e8e1d8] shadow-[0_12px_40px_rgba(0,0,0,0.12)] transition-all duration-300 ease-out sm:w-auto sm:border-0 sm:bg-transparent sm:shadow-none ${
              heroMenuOpen
                ? // sm+: the panel is see-through, so only its links take clicks and a click
                  // anywhere else on the hero counts as outside and closes it
                  "pointer-events-auto visible translate-y-0 opacity-100 sm:pointer-events-none"
                : "invisible -translate-y-3 opacity-0"
            }`}
          >
            {/* Phones: centred on the ivory panel. sm and up: no background, so white type with
                a soft shadow keeps it readable on the hero */}
            <nav className="flex max-h-screen flex-col items-center overflow-y-auto px-8 pt-8 pb-12 text-center sm:pt-4 sm:pr-3 sm:pl-4 sm:drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:[&_a]:pointer-events-auto sm:[&_button]:pointer-events-auto md:pt-5 md:pr-6 lg:pr-10">
              <Link href="/" className="block h-10 w-28">
                <Image
                  src={LOGO_URL}
                  alt="Wedding Goosebumps"
                  width={78}
                  height={31}
                  className="h-full w-full object-contain sm:brightness-0 sm:invert"
                />
              </Link>

              <div className="my-6 h-px w-12 bg-[#D9D5CF] sm:bg-white/60" />

              <ul className="flex flex-col items-center gap-y-5">
                {navLinks.map((link) => (
                  <li key={`${link.name}-hero`}>
                    <Link
                      href={link.href}
                      className="font-lora text-charcoal hover:text-gold text-[13px] tracking-[0.2em] transition-colors duration-300 sm:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}

                {/* EVENTS — sm+: a plain link, since long event titles overflow the narrow
                    see-through menu; phones keep the expandable list on the ivory panel */}
                <li>
                  <Link
                    href="/events"
                    className="font-lora hover:text-gold hidden text-[13px] tracking-[0.2em] text-white transition-colors duration-300 sm:block"
                  >
                    EVENTS
                  </Link>

                  <button
                    type="button"
                    onClick={() => setHeroEventsOpen(!heroEventsOpen)}
                    className="font-lora text-charcoal hover:text-gold flex items-center gap-2 text-[13px] tracking-[0.2em] transition-colors duration-300 sm:hidden"
                  >
                    EVENTS
                    <svg
                      className={`h-3 w-3 transition-transform ${heroEventsOpen ? "rotate-180" : ""}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {heroEventsOpen && (
                    <div className="mt-3 flex flex-col items-center sm:hidden">
                      {eventLinks.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/events/${item.slug}`}
                          className="font-lora text-charcoal hover:text-gold block border-b border-[#ebe6de] py-2.5 text-[11px] tracking-[0.2em] uppercase transition-colors last:border-none"
                        >
                          {item.title}
                        </Link>
                      ))}

                      <Link
                        href="/events"
                        className="font-lora text-gold pt-3 text-[11px] tracking-[0.2em] uppercase"
                      >
                        View All Events →
                      </Link>
                    </div>
                  )}
                </li>
              </ul>
            </nav>
          </div>

          {/* Trigger — same box as the header so it stays put when the panel opens */}
          <div className="relative flex h-[64px] items-center justify-end px-4 sm:h-[72px] sm:px-6 md:h-[81px] md:px-10 lg:px-16">
            {/* Hidden while the menu is open so only the menu shows in the corner;
                an outside click, Escape or a link closes it */}
            <button
              type="button"
              onClick={() => setIsHeroMenuOpen(true)}
              tabIndex={showHeroTrigger && !heroMenuOpen ? 0 : -1}
              aria-label="Open menu"
              aria-expanded={heroMenuOpen}
              className={`flex h-10 w-10 items-center justify-center rounded-full bg-black/20 text-white ring-1 ring-white/30 backdrop-blur-md transition-all duration-300 hover:bg-black/35 sm:h-11 sm:w-11 ${
                showHeroTrigger && !heroMenuOpen ? "pointer-events-auto opacity-100" : "opacity-0"
              }`}
            >
              <Ellipsis size={22} className="sm:h-6 sm:w-6" />
            </button>
          </div>
        </div>
      </div>

      <header
        className={`fixed top-0 left-0 z-40 w-full transition-all duration-500 ease-in-out ${
          isVisible
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-full opacity-0"
        } ${isMenuOpen ? "!pointer-events-auto !translate-y-0 !opacity-100" : ""}`}
      >
        <div
          className={`transition-colors duration-300 ${isMenuOpen ? "bg-ivory" : "bg-ivory/90 backdrop-blur-md"}`}
        >
          <div className="mx-auto flex h-[64px] max-w-[1700px] items-center justify-between px-4 sm:h-[72px] sm:px-6 md:h-[81px] md:px-10 lg:px-16">
            <Link
              href="/"
              className="relative z-50 flex h-8 w-23 shrink-0 items-center sm:h-9 sm:w-28 md:h-12 md:w-31 lg:h-14 lg:w-36"
            >
              <Image
                src={LOGO_URL}
                alt="Wedding Goosebumps"
                width={78}
                height={31}
                className="h-full w-full object-contain"
                priority
              />
            </Link>

            <nav className="hidden lg:block">
              <ul className="flex items-center space-x-10">
                {navLinks.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="font-lora text-charcoal hover:text-gold text-[11px] tracking-[0.2em] transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}

                {/* EVENTS DROPDOWN — not `relative`, so the panel lines up with the (full-width,
                    fixed) header rather than this item. The padding makes the item as tall as the
                    header, so the pointer moves straight from EVENTS into the panel below it */}
                <li className="group py-8">
                  <button className="font-lora text-charcoal hover:text-gold flex items-center gap-1 text-[11px] tracking-[0.2em] uppercase transition-colors duration-300">
                    EVENTS
                    <svg
                      className="h-3 w-3 transition-transform duration-300 group-hover:rotate-180"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>

                  {/* Flush with the right edge of the screen, directly under the header */}
                  <div className="invisible absolute top-full right-0 z-50 w-72 rounded-l-md border border-r-0 border-[#e8e1d8] bg-white opacity-0 shadow-[0_12px_40px_rgba(0,0,0,0.08)] transition-all duration-300 group-hover:visible group-hover:opacity-100">
                    {/* Event Links: scroll once there are more than fit below the header, so every
                        event and "View All Events" stay reachable */}
                    <div className="no-scrollbar max-h-[calc(100vh-13rem)] overflow-y-auto overscroll-contain py-3">
                      {eventLinks.map((item) => (
                        <Link
                          key={item.slug}
                          href={`/events/${item.slug}`}
                          className="font-lora text-charcoal hover:text-gold hover:bg-ivory block px-6 py-3 text-[11px] tracking-[0.2em] uppercase transition-colors duration-200"
                        >
                          {item.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Link>
                      ))}
                    </div>

                    {/* Divider */}
                    <div className="mx-6 border-t border-[#ebe6de]" />

                    {/* View All */}
                    <Link
                      href="/events"
                      className="font-lora text-gold hover:bg-ivory block px-6 py-4 text-[11px] tracking-[0.2em] uppercase transition-colors duration-200"
                    >
                      View All Events →
                    </Link>
                  </div>
                </li>
              </ul>
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-charcoal z-50 p-2 lg:hidden"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X size={24} className="sm:h-7 sm:w-7" />
              ) : (
                <Menu size={24} className="sm:h-7 sm:w-7" />
              )}
            </button>
          </div>
        </div>
      </header>

      <div
        className={`bg-ivory fixed inset-0 z-30 transition-opacity duration-500 lg:hidden ${
          isMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        {/* Scrolls when the open Events list is taller than the screen; my-auto keeps the links
            centred while they fit (justify-center would push the top ones out of reach) */}
        <nav className="flex h-full flex-col items-center overflow-y-auto overscroll-contain pt-[72px] pb-12 sm:pt-[80px] md:pt-[88px]">
          <ul className="my-auto flex flex-col items-center gap-y-6 sm:gap-y-8">
            {navLinks.map((link) => (
              <li key={`${link.name}-mobile`}>
                <Link
                  href={link.href}
                  className="font-lora text-charcoal hover:text-gold text-sm tracking-[0.2em] transition-colors duration-300 sm:text-base"
                >
                  {link.name}
                </Link>
              </li>
            ))}

            {/* EVENTS */}
            <li className="w-full text-center">
              <button
                onClick={() => setEventsOpen(!eventsOpen)}
                className="font-lora text-charcoal hover:text-gold flex w-full items-center justify-center gap-2 text-sm tracking-[0.2em] transition-colors duration-300 sm:text-base"
              >
                EVENTS
                <svg
                  className={`h-3 w-3 transition-transform ${eventsOpen ? "rotate-180" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {eventsOpen && (
                <div className="mt-4 flex flex-col items-center space-y-3">
                  {eventLinks.map((item) => (
                    <Link
                      key={item.slug}
                      href={`/events/${item.slug}`}
                      className="font-lora text-charcoal hover:bg-ivory hover:text-gold block border-b border-gray-100 px-5 py-3 text-[11px] tracking-[0.2em] uppercase transition-colors last:border-none"
                    >
                      {item.title}
                    </Link>
                  ))}

                  <Link href="/events" className="text-gold pt-2 text-sm font-semibold">
                    View All Events →
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>

      <WhatsAppButton href={whatsappHref} hidden={isMenuOpen} />
    </>
  );
}
