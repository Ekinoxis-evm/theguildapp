"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { createBooking } from "./actions";

type LocationOption = {
  id: string;
  formatted_address: string;
  city: string;
  state: string;
};

type StaffOption = {
  id: string;
  full_name: string;
  skills: string[];
  guild_profile_id: string | null;
  guild_headline: string | null;
};

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900";

export function BookingForm({
  shopId,
  serviceId,
  serviceName,
  priceCents,
  currency,
  durationMinutes,
  locations,
  staff,
  photosComplete,
  oldestPhotoUpdate,
  photoUrls,
}: {
  shopId: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
  currency: string;
  durationMinutes: number;
  locations: LocationOption[];
  staff: StaffOption[];
  photosComplete: boolean;
  oldestPhotoUpdate: string | null;
  photoUrls: { position: string; url: string }[];
}) {
  // Style gate first: the client confirms their four photos are current
  // before picking a slot (PRODUCT.md "style check on every booking").
  const [styleConfirmed, setStyleConfirmed] = useState(false);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [when, setWhen] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!photosComplete) {
    return (
      <div className="mt-8 rounded border border-yellow-600/40 bg-yellow-50 p-4 text-sm">
        <p className="font-medium">Your style photos are incomplete</p>
        <p className="mt-1 text-neutral-600">
          Barbers need your four current-style photos (front, left, right,
          back) before you can book.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-block rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          Update My Style
        </Link>
      </div>
    );
  }

  if (!styleConfirmed) {
    return (
      <div className="mt-8">
        <p className="text-sm text-neutral-600">
          Is your current style still accurate? Your barber will prepare based
          on these photos
          {oldestPhotoUpdate ? ` (last updated ${formatDate(oldestPhotoUpdate)})` : ""}
          .
        </p>
        <div className="mt-4 grid grid-cols-4 gap-2">
          {photoUrls.map((p) => (
            // eslint-disable-next-line @next/next/no-img-element -- signed URLs
            <img
              key={p.position}
              src={p.url}
              alt={`${p.position} style photo`}
              className="aspect-square w-full rounded border border-neutral-300 object-cover"
            />
          ))}
        </div>
        <div className="mt-6 space-y-2">
          <button
            onClick={() => setStyleConfirmed(true)}
            className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Yes, photos are current
          </button>
          <Link
            href="/profile"
            className="block w-full rounded border border-neutral-300 px-4 py-2 text-center text-sm"
          >
            No — update my photos first
          </Link>
        </div>
      </div>
    );
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await createBooking({
      shopId,
      serviceId,
      locationId,
      staffId,
      scheduledAt: new Date(when).toISOString(),
    });
    if (!result.ok) {
      setSaving(false);
      setError(result.error);
      return;
    }
    // Booking created — hand off to Stripe Checkout to pay in full.
    window.location.assign(result.checkoutUrl);
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <p className="rounded border border-neutral-300 p-3 text-sm">
        {serviceName}
        <span className="block text-neutral-500">
          {formatPrice(priceCents, currency)} · {durationMinutes} min · paid
          online at booking
        </span>
      </p>

      {locations.length > 0 && (
        <label className="block text-sm">
          Location
          <select
            value={locationId ?? ""}
            onChange={(e) => setLocationId(e.target.value)}
            className={inputClass}
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.formatted_address} — {l.city}, {l.state}
              </option>
            ))}
          </select>
        </label>
      )}

      {staff.length > 0 && (
        <label className="block text-sm">
          Barber
          <select
            value={staffId ?? ""}
            onChange={(e) => setStaffId(e.target.value || null)}
            className={inputClass}
          >
            <option value="">Any available barber</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.full_name}
                {s.skills.length > 0 ? ` — ${s.skills.join(", ")}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        Date &amp; time
        <input
          type="datetime-local"
          required
          value={when}
          onChange={(e) => setWhen(e.target.value)}
          className={inputClass}
        />
      </label>

      <button
        type="submit"
        disabled={saving || !when}
        className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Redirecting to payment…" : "Book & pay"}
      </button>
      <p className="text-xs text-neutral-500">
        You&apos;ll pay securely via Stripe. The shop confirms your request —
        track the status in Bookings.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
