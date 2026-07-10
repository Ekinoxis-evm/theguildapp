"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatDateTime } from "@/lib/format";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type Attendee = {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  registered_at: string;
  service_claimed_at: string | null;
};
export type ManagedEvent = EventRow & {
  registrationUrl: string;
  qrDataUrl: string;
  attendees: Attendee[];
};

const NEXT_STATUS: Partial<Record<EventRow["status"], { label: string; to: EventRow["status"] }>> = {
  draft: { label: "Go live", to: "live" },
  live: { label: "Finish event", to: "finished" },
};

export function EventCard({ event }: { event: ManagedEvent }) {
  const [status, setStatus] = useState(event.status);
  const [attendees, setAttendees] = useState(event.attendees);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function changeStatus(to: EventRow["status"]) {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").update({ status: to }).eq("id", event.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStatus(to);
  }

  async function markClaimed(attendee: Attendee) {
    setError(null);
    const supabase = createClient();
    const claimedAt = new Date().toISOString();
    const { error } = await supabase
      .from("event_registrations")
      .update({ service_claimed_at: claimedAt })
      .eq("event_id", event.id)
      .eq("profile_id", attendee.profile_id);
    if (error) {
      setError(error.message);
      return;
    }
    setAttendees(
      attendees.map((a) =>
        a.profile_id === attendee.profile_id ? { ...a, service_claimed_at: claimedAt } : a
      )
    );
  }

  const next = NEXT_STATUS[status];
  const claimed = attendees.filter((a) => a.service_claimed_at).length;

  return (
    <section className="rounded border border-neutral-300 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium">
            {event.title} <span className="font-normal text-neutral-500">× {event.brand_name}</span>
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {event.venue} · {formatDateTime(event.starts_at)}
          </p>
          <p className="mt-1 text-xs uppercase tracking-wide text-yellow-600">{status}</p>
        </div>
        {next && (
          <button
            disabled={busy}
            onClick={() => changeStatus(next.to)}
            className="shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
          >
            {next.label}
          </button>
        )}
      </div>

      {status === "live" && (
        <div className="mt-4 flex items-center gap-4 rounded border border-neutral-200 bg-neutral-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- data URL */}
          <img src={event.qrDataUrl} alt="Registration QR code" className="h-28 w-28" />
          <div className="text-xs text-neutral-600">
            <p className="font-medium text-neutral-900">Registration QR</p>
            <p className="mt-1 break-all">{event.registrationUrl}</p>
            <p className="mt-1">Print it or show it at the activation entrance.</p>
          </div>
        </div>
      )}

      <p className="mt-4 text-sm font-medium">
        Attendees · {attendees.length} registered, {claimed} served
      </p>
      <ul className="mt-2 space-y-1">
        {attendees.map((a) => (
          <li
            key={a.profile_id}
            className="flex items-center justify-between gap-3 rounded border border-neutral-200 px-3 py-2 text-sm"
          >
            <span>
              {[a.first_name, a.last_name].filter(Boolean).join(" ") || "Attendee"}
              {a.service_claimed_at && (
                <span className="ml-2 text-xs text-neutral-500">
                  served {formatDateTime(a.service_claimed_at)}
                </span>
              )}
            </span>
            {!a.service_claimed_at && status === "live" && (
              <button
                onClick={() => markClaimed(a)}
                className="shrink-0 rounded border border-neutral-300 px-2 py-1 text-xs"
              >
                Mark served
              </button>
            )}
          </li>
        ))}
        {attendees.length === 0 && (
          <li className="text-sm text-neutral-500">No registrations yet.</li>
        )}
      </ul>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
