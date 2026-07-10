"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate, formatPrice } from "@/lib/format";

type PendingBarber = {
  profile_id: string;
  bio: string | null;
  base_price_cents: number;
  created_at: string;
  profiles: { first_name: string | null; last_name: string | null; phone: string | null } | null;
};

export function BarberApprovals({ initial }: { initial: PendingBarber[] }) {
  const [barbers, setBarbers] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(barber: PendingBarber) {
    setError(null);
    setBusy(barber.profile_id);
    const supabase = createClient();
    const { error } = await supabase.rpc("approve_private_barber", {
      barber_id: barber.profile_id,
    });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setBarbers(barbers.filter((b) => b.profile_id !== barber.profile_id));
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-medium">Private barber applications</h2>
      {barbers.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No pending applications.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {barbers.map((b) => {
            const name =
              [b.profiles?.first_name, b.profiles?.last_name].filter(Boolean).join(" ") ||
              b.profile_id;
            return (
              <li key={b.profile_id} className="rounded border border-neutral-300 p-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span>
                    <strong>{name}</strong>
                    <span className="block text-neutral-500">
                      Applied {formatDate(b.created_at)} · from{" "}
                      {formatPrice(b.base_price_cents)}
                      {b.profiles?.phone ? ` · ${b.profiles.phone}` : ""}
                    </span>
                    {b.bio && <span className="mt-1 block">{b.bio}</span>}
                  </span>
                  <button
                    disabled={busy === b.profile_id}
                    onClick={() => approve(b)}
                    className="shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                  >
                    {busy === b.profile_id ? "Approving…" : "Approve"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
