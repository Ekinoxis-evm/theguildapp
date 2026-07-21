"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";

type Enrollment = {
  id: string;
  role_title: string | null;
  started_on: string;
  ended_on: string | null;
  confirmed_at: string | null;
  private_barbers: {
    profiles: { first_name: string | null; last_name: string | null } | null;
  } | null;
};

export function EnrollmentsManager({ initial }: { initial: Enrollment[] }) {
  const [enrollments, setEnrollments] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setConfirmed(enrollment: Enrollment, confirmed: boolean) {
    setError(null);
    setBusy(enrollment.id);
    const supabase = createClient();
    const confirmedAt = confirmed ? new Date().toISOString() : null;
    // Trigger restricts the shop owner to the confirmation fields only.
    const { error } = await supabase
      .from("barber_affiliations")
      .update({ confirmed_at: confirmedAt })
      .eq("id", enrollment.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setEnrollments(
      enrollments.map((e) =>
        e.id === enrollment.id ? { ...e, confirmed_at: confirmedAt } : e
      )
    );
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Barber enrollments</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Guild barbers who list your shop on their profile. Confirming adds a
        trust badge — it does not give you control over their profile.
      </p>
      {enrollments.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">
          No barbers have enrolled with your shop yet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2">
          {enrollments.map((e) => {
            const name =
              [
                e.private_barbers?.profiles?.first_name,
                e.private_barbers?.profiles?.last_name,
              ]
                .filter(Boolean)
                .join(" ") || "Guild barber";
            return (
              <li
                key={e.id}
                className="flex items-baseline justify-between gap-3 border border-neutral-800 p-3 text-sm"
              >
                <div>
                  <strong>{name}</strong>
                  {e.confirmed_at && (
                    <span className="ml-2 text-xs font-medium text-emerald-400">
                      ✓ Confirmed
                    </span>
                  )}
                  <p className="text-neutral-400">
                    {e.role_title ? `${e.role_title} · ` : ""}since{" "}
                    {formatDate(e.started_on)}
                  </p>
                </div>
                <button
                  disabled={busy === e.id}
                  onClick={() => setConfirmed(e, !e.confirmed_at)}
                  className={
                    e.confirmed_at
                      ? "shrink-0 text-xs text-red-600 underline disabled:opacity-50"
                      : "shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  }
                >
                  {busy === e.id
                    ? "Saving…"
                    : e.confirmed_at
                      ? "Revoke confirmation"
                      : "Confirm"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
