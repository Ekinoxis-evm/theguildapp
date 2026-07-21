"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { uploadBarberPhoto } from "@/lib/storage";

type Barber = Database["public"]["Tables"]["private_barbers"]["Row"];

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function BarberProfileEditor({
  barber,
  selfUrl,
  setupUrl,
}: {
  barber: Barber;
  selfUrl: string | null;
  setupUrl: string | null;
}) {
  const [bio, setBio] = useState(barber.bio ?? "");
  const [headline, setHeadline] = useState(barber.headline ?? "");
  const [years, setYears] = useState(
    barber.years_experience != null ? String(barber.years_experience) : ""
  );
  const [specialties, setSpecialties] = useState(barber.specialties.join(", "));
  const [offersHome, setOffersHome] = useState(barber.offers_home_service);
  const [price, setPrice] = useState((barber.base_price_cents / 100).toFixed(2));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("private_barbers")
      .update({
        bio: bio.trim() || null,
        headline: headline.trim() || null,
        years_experience: years === "" ? null : Math.round(Number(years)),
        specialties: specialties
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        offers_home_service: offersHome,
        base_price_cents: Math.round(parseFloat(price || "0") * 100),
      })
      .eq("profile_id", barber.profile_id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Profile</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <PhotoSlot
          label="Photo of you"
          kind="self"
          barberId={barber.profile_id}
          initialPath={barber.self_photo_path}
          initialUrl={selfUrl}
        />
        <PhotoSlot
          label="Your mobile setup"
          kind="setup"
          barberId={barber.profile_id}
          initialPath={barber.setup_photo_path}
          initialUrl={setupUrl}
        />
      </div>
      <form onSubmit={save} className="mt-4 space-y-3">
        <label className="block text-sm">
          Headline
          <input
            type="text"
            maxLength={120}
            placeholder="Master barber · fades & classic cuts"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          About you
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Years of experience
            <input
              type="number"
              min="0"
              max="80"
              value={years}
              onChange={(e) => setYears(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Specialties (comma-separated)
            <input
              type="text"
              placeholder="fades, beard sculpting"
              value={specialties}
              onChange={(e) => setSpecialties(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={offersHome}
            onChange={(e) => setOffersHome(e.target.checked)}
          />
          I offer at-home service (premium clients can book me to come to them)
        </label>
        <label className="block text-sm">
          Base price (USD)
          <input
            required
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
        {saved && <span className="ml-3 text-sm text-green-400">Saved.</span>}
        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </section>
  );
}

function PhotoSlot({
  label,
  kind,
  barberId,
  initialPath,
  initialUrl,
}: {
  label: string;
  kind: "self" | "setup";
  barberId: string;
  initialPath: string | null;
  initialUrl: string | null;
}) {
  const [path, setPath] = useState(initialPath);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const newPath = await uploadBarberPhoto(barberId, kind, file, path);
      setPath(newPath);
      setUrl(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex aspect-square w-full flex-col items-center justify-center overflow-hidden border border-neutral-800 bg-neutral-800 text-sm disabled:opacity-50"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed/blob URLs
          <img src={url} alt={label} className="h-full w-full object-cover" />
        ) : (
          <>
            <span className="text-2xl text-neutral-400">+</span>
            <span className="mt-1 text-neutral-400">{busy ? "Uploading…" : label}</span>
          </>
        )}
      </button>
      <p className="mt-1 text-xs text-neutral-500">{label}</p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onSelect}
        className="hidden"
      />
    </div>
  );
}
