"use client";

import { STYLE_TAGS } from "@/lib/style-tags";

// Selectable style-tag chips — the taste picker. Used by clients (what you
// like) and barbers (what you do); matching scores the overlap.
export function StyleChips({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(value: string) {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {STYLE_TAGS.map((tag) => {
        const active = selected.includes(tag.value);
        return (
          <button
            key={tag.value}
            type="button"
            onClick={() => toggle(tag.value)}
            aria-pressed={active}
            className={
              active
                ? "btn btn-primary px-3 py-1.5 text-xs"
                : "btn btn-outline px-3 py-1.5 text-xs"
            }
          >
            {tag.label}
          </button>
        );
      })}
    </div>
  );
}
