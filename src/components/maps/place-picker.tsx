"use client";

import { useEffect, useRef, useState } from "react";
import { mapsEnabled, mapsReady, parsePlace, type ParsedPlace } from "@/lib/maps";

// Google Places autocomplete input. Calls onSelect with parsed address parts
// when the user picks a suggestion. Renders nothing if Maps isn't configured —
// callers keep their manual fields as the fallback/editable source of truth.
export function PlacePicker({
  onSelect,
  placeholder = "Search the address…",
}: {
  onSelect: (place: ParsedPlace) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const onSelectRef = useRef(onSelect);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!mapsEnabled() || !inputRef.current) return;
    let autocomplete: google.maps.places.Autocomplete | undefined;
    let cancelled = false;

    mapsReady()
      .then((g) => {
        if (cancelled || !inputRef.current) return;
        autocomplete = new g.maps.places.Autocomplete(inputRef.current, {
          fields: ["place_id", "geometry", "address_components", "formatted_address", "name"],
          types: ["address"],
        });
        autocomplete.addListener("place_changed", () => {
          const parsed = autocomplete && parsePlace(autocomplete.getPlace());
          if (parsed) onSelectRef.current(parsed);
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
    };
  }, []);

  if (!mapsEnabled() || failed) return null;

  return (
    <label className="block text-sm">
      Find address
      <input
        ref={inputRef}
        placeholder={placeholder}
        className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
      />
      <span className="mt-1 block text-xs text-neutral-500">
        Pick a suggestion to fill the fields below, then adjust if needed.
      </span>
    </label>
  );
}
