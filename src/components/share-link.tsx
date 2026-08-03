"use client";

import { useEffect, useState } from "react";

// Copyable public link for a shop or barber profile — made for Instagram
// bios and business cards. Visitors who aren't signed in get the login
// screen and land back on the right page afterwards.
export function ShareLink({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  // Origin is only known in the browser; render the bare path on the server
  // and hydrate the full URL afterwards (avoids a hydration mismatch).
  const [url, setUrl] = useState(path);
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setUrl(`${window.location.origin}${path}`);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard can be unavailable (http, permissions) — show the URL instead.
      window.prompt("Copy your link:", url);
    }
  }

  return (
    <div className="mt-4 border border-neutral-800 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">{label}</p>
      <p className="mt-1 break-all text-sm text-neutral-400">{url}</p>
      <button
        onClick={copy}
        className="mt-3 bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black"
      >
        {copied ? "Copied ✓" : "Copy link"}
      </button>
      <p className="mt-2 text-xs text-neutral-500">
        Put it in your Instagram bio — clients land straight on your booking page.
      </p>
    </div>
  );
}
