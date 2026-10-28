"use client";

import { useState } from "react";
import { Link2 } from "lucide-react";

export default function CopyLinkButton({ url, className }: { url: string; className: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={className}
      aria-label="Copy link"
      title={copied ? "Copied" : "Copy link"}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy this link", url);
        }
      }}
    >
      <Link2 className="h-5 w-5" />
      <span className="sr-only" aria-live="polite">{copied ? "Link copied" : ""}</span>
    </button>
  );
}
