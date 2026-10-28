"use client";

import { WHATSAPP_ICON_PATH } from "@/lib/whatsapp";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

// Counted in the admin dashboard (chats never reach the Leads inbox) and sent to Google Analytics
function trackClick() {
  const page = window.location.pathname;
  try {
    navigator.sendBeacon?.("/api/whatsapp-click", JSON.stringify({ page }));
  } catch {
    // tracking must never block the chat from opening
  }
  window.gtag?.("event", "whatsapp_click", { page_path: page });
}

export default function WhatsAppButton({ href, hidden }: { href: string; hidden: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      aria-label="Chat with us on WhatsApp"
      aria-hidden={hidden}
      tabIndex={hidden ? -1 : undefined}
      // z-[35]: above page sections, below the fixed navbar; hidden while the phone menu is open
      className={`group bg-gold fixed right-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] z-[35] flex h-13 w-13 items-center justify-center rounded-full text-white shadow-[0_6px_24px_rgba(30,30,30,0.18)] transition-all duration-300 hover:bg-[#b39a63] focus-visible:ring-2 focus-visible:ring-[#C2A770]/50 focus-visible:ring-offset-2 focus-visible:outline-none motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-90 motion-safe:duration-500 sm:right-6 sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))] ${
        hidden ? "pointer-events-none scale-90 opacity-0" : "opacity-100"
      }`}
    >
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d={WHATSAPP_ICON_PATH} />
      </svg>

      {/* Label slides out on hover where there's a mouse; phones just get the icon */}
      <span className="font-lora text-charcoal pointer-events-none absolute right-full mr-3 hidden translate-x-2 rounded-full bg-white px-4 py-2 text-[11px] tracking-[0.2em] whitespace-nowrap uppercase opacity-0 shadow-[0_6px_24px_rgba(30,30,30,0.12)] transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:block">
        Chat with us on WhatsApp
      </span>
    </a>
  );
}
