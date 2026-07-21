"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900";

export function ApplyBarberForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("");
  const [offersHome, setOffersHome] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("private_barbers").insert({
      profile_id: profileId,
      bio: bio.trim() || null,
      base_price_cents: Math.round(parseFloat(price || "0") * 100),
      offers_home_service: offersHome,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm">
        About you
        <textarea
          rows={3}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          className={inputClass}
          placeholder="Experience, specialties, where you've worked…"
        />
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
          placeholder="80.00"
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={offersHome}
          onChange={(e) => setOffersHome(e.target.checked)}
        />
        I offer at-home service
      </label>
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Submit application"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
