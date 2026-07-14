"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { formatDate, formatPrice } from "@/lib/format";
import { createAtHomeBooking, type AddressInput } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900";

export function AtHomeBookingForm({
  barberId,
  serviceId,
  serviceName,
  priceCents,
  currency,
  durationMinutes,
  photosComplete,
  oldestPhotoUpdate,
  photoUrls,
  savedAddress,
}: {
  barberId: string;
  serviceId: string;
  serviceName: string;
  priceCents: number;
  currency: string;
  durationMinutes: number;
  photosComplete: boolean;
  oldestPhotoUpdate: string | null;
  photoUrls: { position: string; url: string }[];
  savedAddress: AddressInput | { unit: string | null } & Omit<AddressInput, "unit"> | null;
}) {
  const [styleConfirmed, setStyleConfirmed] = useState(false);
  const [when, setWhen] = useState("");
  const [address, setAddress] = useState<AddressInput>({
    street_address: savedAddress?.street_address ?? "",
    unit: savedAddress?.unit ?? "",
    city: savedAddress?.city ?? "",
    state: savedAddress?.state ?? "",
    zip_code: savedAddress?.zip_code ?? "",
  });
  const [saveAddress, setSaveAddress] = useState(!savedAddress);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!photosComplete) {
    return (
      <div className="mt-8 rounded border border-yellow-600/40 bg-yellow-50 p-4 text-sm">
        <p className="font-medium">Your style photos are incomplete</p>
        <p className="mt-1 text-neutral-600">
          Your barber needs your four current-style photos before you can book.
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
          {oldestPhotoUpdate ? ` (last updated ${formatDate(oldestPhotoUpdate)})` : ""}.
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
    const result = await createAtHomeBooking({
      barberId,
      serviceId,
      scheduledAt: new Date(when).toISOString(),
      address,
      saveAddress,
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
          {formatPrice(priceCents, currency)} · {durationMinutes} min · paid online at booking
        </span>
      </p>

      <fieldset className="space-y-3 rounded border border-neutral-300 p-3">
        <legend className="px-1 text-sm font-medium">Service address</legend>
        <label className="block text-sm">
          Street address
          <input
            required
            autoComplete="street-address"
            value={address.street_address}
            onChange={(e) => setAddress({ ...address, street_address: e.target.value })}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Unit / apt (optional)
            <input
              value={address.unit}
              onChange={(e) => setAddress({ ...address, unit: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            City
            <input
              required
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            State
            <input
              required
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Zip code
            <input
              required
              value={address.zip_code}
              onChange={(e) => setAddress({ ...address, zip_code: e.target.value })}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-600">
          <input
            type="checkbox"
            checked={saveAddress}
            onChange={(e) => setSaveAddress(e.target.checked)}
          />
          Save as my default address
        </label>
      </fieldset>

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
        {saving ? "Redirecting to payment…" : "Book at-home & pay"}
      </button>
      <p className="text-xs text-neutral-500">
        Your address is shared only with this barber, only for this booking.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
