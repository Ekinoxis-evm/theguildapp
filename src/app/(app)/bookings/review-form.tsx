"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ReviewSummary = { rating: number; comment: string | null } | null;

// Stars + optional comment for a completed, paid booking. The database
// enforces the verified-purchase rule and stamps who the review targets.
export function ReviewForm({
  bookingId,
  clientId,
  existing,
}: {
  bookingId: string;
  clientId: string;
  existing: ReviewSummary;
}) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? "");
  const [saved, setSaved] = useState<ReviewSummary>(existing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (rating < 1) return;
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const payload = { rating, comment: comment.trim() || null };
    const { error: dbError } = saved
      ? await supabase.from("reviews").update(payload).eq("booking_id", bookingId)
      : await supabase
          .from("reviews")
          .insert({ booking_id: bookingId, client_id: clientId, ...payload });
    setSaving(false);
    if (dbError) {
      setError(dbError.message);
      return;
    }
    setSaved({ rating, comment: payload.comment });
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-2 text-sm font-bold uppercase tracking-wide text-guild-yellow"
      >
        {saved ? `Your review: ${"★".repeat(saved.rating)} — edit` : "Rate your cut →"}
      </button>
    );
  }

  return (
    <div className="mt-3 border border-neutral-800 p-3">
      <div className="flex gap-1 text-2xl">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? "s" : ""}`}
            className={n <= rating ? "text-guild-yellow" : "text-neutral-700"}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={3}
        placeholder="How was it? (optional)"
        className="mt-2 w-full border border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-guild-yellow"
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving || rating < 1}
          className="bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
        >
          {saving ? "Saving…" : saved ? "Update review" : "Publish review"}
        </button>
        <button onClick={() => setOpen(false)} className="text-sm text-neutral-500 underline">
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
