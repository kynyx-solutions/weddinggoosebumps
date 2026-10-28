"use client";

import { useEffect } from "react";

export const UTM_STORAGE_KEY = "wg_utm";

// Remembers the ad or campaign that brought the visitor in (utm_* in the landing URL) for the
// rest of the visit, so an inquiry sent from another page still records where it came from
export default function UtmCapture() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    };
    if (!utm.utmSource && !utm.utmMedium && !utm.utmCampaign) return;
    try {
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    } catch {
      // private browsing can block storage; the inquiry still goes through without it
    }
  }, []);

  return null;
}

export function readStoredUtm(): Record<string, string | null> {
  try {
    return JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}
