import { formatDate } from "@/lib/format";

export type ReviewRow = { rating: number; comment: string | null; created_at: string };

export function ratingSummary(reviews: { rating: number }[]) {
  if (!reviews.length) return null;
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return { avg: Math.round(avg * 10) / 10, count: reviews.length };
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="text-guild-yellow" aria-label={`${value} out of 5`}>
      {"★".repeat(Math.round(value))}
      <span className="text-neutral-700">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

export function RatingBadge({ reviews }: { reviews: { rating: number }[] }) {
  const summary = ratingSummary(reviews);
  if (!summary) return null;
  return (
    <span className="text-sm">
      <Stars value={summary.avg} />{" "}
      <span className="text-neutral-400">
        {summary.avg} ({summary.count})
      </span>
    </span>
  );
}

// Recent reviews, anonymous by design: rating + words + date, never a name.
export function ReviewList({ reviews, limit = 6 }: { reviews: ReviewRow[]; limit?: number }) {
  if (!reviews.length) return null;
  return (
    <section className="mt-8">
      <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-neutral-500">
        Reviews
      </h2>
      <ul className="mt-3 space-y-3">
        {reviews.slice(0, limit).map((r, i) => (
          <li key={i} className="border border-neutral-800 p-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <Stars value={r.rating} />
              <span className="text-xs text-neutral-500">{formatDate(r.created_at)}</span>
            </div>
            {r.comment && <p className="mt-2 text-neutral-300">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
