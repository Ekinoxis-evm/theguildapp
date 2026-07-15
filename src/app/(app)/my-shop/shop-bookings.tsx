"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  services: { name: string; duration_minutes: number } | null;
  profiles: { first_name: string | null; last_name: string | null } | null;
  barbershop_staff?: { full_name: string } | null;
};
type Status = Database["public"]["Enums"]["booking_status"];

const ACTIONS: Partial<Record<Status, { label: string; to: Status }[]>> = {
  pending: [
    { label: "Confirm", to: "confirmed" },
    { label: "Cancel", to: "cancelled" },
  ],
  confirmed: [
    { label: "Mark completed", to: "completed" },
    { label: "No-show", to: "no_show" },
    { label: "Cancel", to: "cancelled" },
  ],
};

export function ShopBookings({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function transition(booking: Booking, to: Status) {
    setError(null);
    setBusy(booking.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status: to })
      .eq("id", booking.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setBookings(bookings.map((b) => (b.id === booking.id ? { ...b, status: to } : b)));
  }

  const upcoming = bookings.filter((b) =>
    ["pending", "confirmed"].includes(b.status)
  );
  const past = bookings
    .filter((b) => !["pending", "confirmed"].includes(b.status))
    .reverse();

  return (
    <section>
      <h2 className="text-lg font-medium">Bookings</h2>
      <BookingList
        bookings={upcoming}
        emptyText="No upcoming bookings."
        busy={busy}
        onTransition={transition}
      />
      {past.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-medium text-neutral-600">History</h3>
          <BookingList bookings={past} emptyText="" busy={busy} onTransition={transition} />
        </>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}

function BookingList({
  bookings,
  emptyText,
  busy,
  onTransition,
}: {
  bookings: Booking[];
  emptyText: string;
  busy: string | null;
  onTransition: (b: Booking, to: Status) => void;
}) {
  if (bookings.length === 0) {
    return emptyText ? <p className="mt-3 text-sm text-neutral-500">{emptyText}</p> : null;
  }
  return (
    <ul className="mt-3 space-y-2">
      {bookings.map((b) => {
        const client =
          [b.profiles?.first_name, b.profiles?.last_name].filter(Boolean).join(" ") ||
          "Client";
        return (
          <li key={b.id} className="rounded border border-neutral-300 p-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span>
                <strong>{formatDateTime(b.scheduled_at)}</strong> — {client}
                <span className="block text-neutral-500">
                  {b.services?.name ?? "Service"} · {b.duration_minutes} min
                  {b.barbershop_staff?.full_name
                    ? ` · with ${b.barbershop_staff.full_name}`
                    : ""}{" "}
                  · <span className="uppercase">{b.status.replace("_", " ")}</span>
                  {b.paid_at && <span className="text-emerald-700"> · PAID</span>}
                </span>
              </span>
              <span className="flex shrink-0 gap-2">
                {(ACTIONS[b.status] ?? []).map((a) => (
                  <button
                    key={a.to}
                    disabled={busy === b.id}
                    onClick={() => onTransition(b, a.to)}
                    className="rounded border border-neutral-300 px-2 py-1 text-xs disabled:opacity-50"
                  >
                    {a.label}
                  </button>
                ))}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
