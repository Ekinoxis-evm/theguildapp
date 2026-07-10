"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Coverage = Database["public"]["Tables"]["coverage_areas"]["Row"];

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function CoverageManager({
  barberId,
  initial,
}: {
  barberId: string;
  initial: Coverage[];
}) {
  const [areas, setAreas] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    country: "United States",
    state: "",
    city: "",
    zips: "",
  });

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("coverage_areas")
      .insert({
        private_barber_id: barberId,
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        zip_codes: form.zips
          .split(",")
          .map((z) => z.trim())
          .filter(Boolean),
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAreas([...areas, data]);
    setAdding(false);
    setForm({ country: "United States", state: "", city: "", zips: "" });
  }

  async function remove(id: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("coverage_areas").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setAreas(areas.filter((a) => a.id !== id));
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Coverage areas</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Where you can reach clients for at-home service.
      </p>
      <ul className="mt-3 space-y-2">
        {areas.map((a) => (
          <li
            key={a.id}
            className="flex items-start justify-between gap-3 rounded border border-neutral-300 p-3 text-sm"
          >
            <span>
              {a.city}, {a.state}
              {a.zip_codes.length > 0 && (
                <span className="block text-neutral-500">Zips: {a.zip_codes.join(", ")}</span>
              )}
            </span>
            <button onClick={() => remove(a.id)} className="text-xs text-neutral-500 underline">
              Remove
            </button>
          </li>
        ))}
        {areas.length === 0 && (
          <li className="text-sm text-neutral-500">
            No coverage yet — premium clients can&apos;t find you without it.
          </li>
        )}
      </ul>

      {adding ? (
        <form onSubmit={add} className="mt-4 space-y-3 rounded border border-neutral-300 p-4">
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
          </div>
          <label className="block text-sm">
            Zip codes (comma-separated, optional)
            <input
              value={form.zips}
              onChange={(e) => setForm({ ...form, zips: e.target.value })}
              className={inputClass}
              placeholder="33101, 33109, 33139"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add area"}
            </button>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="rounded border border-neutral-300 px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-4 rounded border border-neutral-300 px-4 py-2 text-sm"
        >
          + Add coverage area
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
