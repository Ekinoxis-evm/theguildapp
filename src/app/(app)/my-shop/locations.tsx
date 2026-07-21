"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { PlacePicker } from "@/components/maps/place-picker";
import { mapsEnabled, type ParsedPlace } from "@/lib/maps";

type Location = Database["public"]["Tables"]["barbershop_locations"]["Row"];

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function LocationsManager({
  shopId,
  initial,
}: {
  shopId: string;
  initial: Location[];
}) {
  const [locations, setLocations] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    formatted_address: "",
    country: "United States",
    state: "",
    city: "",
    zip_code: "",
  });
  const [picked, setPicked] = useState<ParsedPlace | null>(null);

  function applyPlace(place: ParsedPlace) {
    setPicked(place);
    setForm({
      formatted_address: place.formatted_address,
      country: place.country || "United States",
      state: place.state,
      city: place.city,
      zip_code: place.zip_code,
    });
  }

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("barbershop_locations")
      .insert({
        barbershop_id: shopId,
        ...form,
        // Only trust the pin if the address wasn't hand-edited afterwards.
        ...(picked && picked.formatted_address === form.formatted_address
          ? { google_place_id: picked.google_place_id, lat: picked.lat, lng: picked.lng }
          : {}),
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setLocations([...locations, data]);
    setAdding(false);
    setPicked(null);
    setForm({ formatted_address: "", country: "United States", state: "", city: "", zip_code: "" });
  }

  async function remove(id: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("barbershop_locations").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setLocations(locations.filter((l) => l.id !== id));
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Locations</h2>
      <ul className="mt-3 space-y-2">
        {locations.map((l) => (
          <li
            key={l.id}
            className="flex items-start justify-between gap-3 border border-neutral-800 p-3 text-sm"
          >
            <span>
              {l.formatted_address}
              <span className="block text-neutral-500">
                {l.city}, {l.state} {l.zip_code}
              </span>
            </span>
            <button onClick={() => remove(l.id)} className="text-xs text-neutral-500 underline">
              Remove
            </button>
          </li>
        ))}
        {locations.length === 0 && (
          <li className="text-sm text-neutral-500">
            No locations yet — clients can&apos;t find you without one.
          </li>
        )}
      </ul>

      {adding ? (
        <form onSubmit={add} className="mt-4 space-y-3 border border-neutral-800 p-4">
          <PlacePicker onSelect={applyPlace} />
          <label className="block text-sm">
            Street address
            <input
              required
              value={form.formatted_address}
              onChange={(e) => setForm({ ...form, formatted_address: e.target.value })}
              className={inputClass}
              placeholder="123 Collins Ave"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              City
              <input
                required
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              State
              <input
                required
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Zip code
              <input
                required
                value={form.zip_code}
                onChange={(e) => setForm({ ...form, zip_code: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Country
              <input
                required
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add location"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="border border-neutral-800 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 border border-neutral-800 px-4 py-2 text-sm"
        >
          + Add location
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
      {!mapsEnabled() && (
        <p className="mt-2 text-xs text-neutral-500">
          Google Maps search is unavailable — enter the address manually.
        </p>
      )}
    </section>
  );
}
