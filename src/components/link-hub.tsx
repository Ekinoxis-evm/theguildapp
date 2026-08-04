import type { Database } from "@/lib/database.types";

type LinkRow = Pick<
  Database["public"]["Tables"]["barber_links"]["Row"],
  "kind" | "url" | "label"
>;

const KIND_LABEL: Record<string, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  x: "X",
  website: "Website",
};

// The barber's link-in-bio row: socials as outline buttons, external booking
// as a primary action. Rendered on the public profile for all signed-in users.
export function LinkHub({ links }: { links: LinkRow[] }) {
  if (!links.length) return null;
  const socials = links.filter((l) => l.kind !== "booking");
  const booking = links.find((l) => l.kind === "booking");
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {socials.map((l) => (
        <a
          key={l.kind}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline"
        >
          {KIND_LABEL[l.kind] ?? l.kind}
        </a>
      ))}
      {booking && (
        <a
          href={booking.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-primary"
        >
          {booking.label || "Book externally"} ↗
        </a>
      )}
    </div>
  );
}
