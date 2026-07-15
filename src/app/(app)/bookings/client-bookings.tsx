"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatDateTime, formatPrice } from "@/lib/format";
import { payBooking } from "./actions";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  services: { name: string } | null;
  barbershops: { name: string } | null;
  barbershop_locations: {
    formatted_address: string;
    city: string;
    state: string;
  } | null;
  barbershop_staff: { full_name: string } | null;
  googleCalendarUrl: string;
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

export function ClientBookings({ bookings: initial }: { bookings: Booking[] }) {
  const [bookings, setBookings] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function payNow(booking: Booking) {
    setError(null);
    setBusy(booking.id);
    const result = await payBooking(booking.id);
    if (!result.ok) {
      setBusy(null);
      setError(result.error);
      return;
    }
    window.location.assign(result.checkoutUrl);
  }

  async function cancel(booking: Booking) {
    setError(null);
    setBusy(booking.id);
    const supabase = createClient();
    const { error } = await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", booking.id);
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setBookings(
      bookings.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b))
    );
  }

  const upcoming = bookings
    .filter((b) => ["pending", "confirmed"].includes(b.status))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
  const past = bookings.filter((b) => !["pending", "confirmed"].includes(b.status));

  return (
    <div className="mt-6 space-y-8">
      <Section
        title="Upcoming"
        bookings={upcoming}
        emptyText="No upcoming bookings."
        busy={busy}
        onCancel={cancel}
        onPay={payNow}
      />
      {past.length > 0 && (
        <Section
          title="History"
          bookings={past}
          emptyText=""
          busy={busy}
          onCancel={cancel}
          onPay={payNow}
        />
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function Section({
  title,
  bookings,
  emptyText,
  busy,
  onCancel,
  onPay,
}: {
  title: string;
  bookings: Booking[];
  emptyText: string;
  busy: string | null;
  onCancel: (b: Booking) => void;
  onPay: (b: Booking) => void;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium">{title}</h2>
      {bookings.length === 0 ? (
        emptyText && <p className="mt-3 text-sm text-neutral-500">{emptyText}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {bookings.map((b) => {
            const cancellable = ["pending", "confirmed"].includes(b.status);
            const payable = cancellable && !b.paid_at;
            return (
              <li key={b.id} className="rounded border border-neutral-300 p-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <strong>{b.services?.name ?? "Service"}</strong>
                  <span className="shrink-0 text-xs uppercase tracking-wide text-neutral-500">
                    {b.paid_at && (
                      <span className="mr-2 text-emerald-700">
                        Paid
                        {b.amount_cents != null
                          ? ` ${formatPrice(b.amount_cents, b.currency ?? "USD")}`
                          : ""}
                      </span>
                    )}
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </div>
                <p className="mt-1 text-neutral-600">
                  {b.barbershops?.name}
                  {b.barbershop_staff?.full_name
                    ? ` · with ${b.barbershop_staff.full_name}`
                    : ""}{" "}
                  · {formatDateTime(b.scheduled_at)}
                </p>
                {b.barbershop_locations && (
                  <p className="text-neutral-500">
                    {b.barbershop_locations.formatted_address},{" "}
                    {b.barbershop_locations.city}, {b.barbershop_locations.state}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {payable && (
                    <button
                      disabled={busy === b.id}
                      onClick={() => onPay(b)}
                      className="rounded bg-neutral-900 px-3 py-1 font-medium text-white disabled:opacity-50"
                    >
                      {busy === b.id ? "Opening checkout…" : "Pay now"}
                    </button>
                  )}
                  {cancellable && (
                    <>
                      <a href={`/bookings/${b.id}/ics`} className="underline">
                        Add to calendar (.ics)
                      </a>
                      <a
                        href={b.googleCalendarUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Google Calendar
                      </a>
                      <button
                        disabled={busy === b.id}
                        onClick={() => onCancel(b)}
                        className="text-red-600 underline disabled:opacity-50"
                      >
                        {busy === b.id ? "Cancelling…" : "Cancel"}
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
