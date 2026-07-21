"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatPrice } from "@/lib/format";

type Service = Database["public"]["Tables"]["services"]["Row"];

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function BarberServicesManager({
  barberId,
  initial,
}: {
  barberId: string;
  initial: Service[];
}) {
  const [services, setServices] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", price: "", duration: "45" });

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("services")
      .insert({
        private_barber_id: barberId,
        name: form.name.trim(),
        price_cents: Math.round(parseFloat(form.price) * 100),
        duration_minutes: parseInt(form.duration, 10),
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setServices([...services, data]);
    setAdding(false);
    setForm({ name: "", price: "", duration: "45" });
  }

  async function toggleActive(service: Service) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("services")
      .update({ active: !service.active })
      .eq("id", service.id);
    if (error) {
      setError(error.message);
      return;
    }
    setServices(
      services.map((s) => (s.id === service.id ? { ...s, active: !s.active } : s))
    );
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Your services</h2>
      <ul className="mt-3 space-y-2">
        {services.map((s) => (
          <li
            key={s.id}
            className={`flex items-center justify-between gap-3 rounded border border-neutral-300 p-3 text-sm ${
              s.active ? "" : "opacity-50"
            }`}
          >
            <span>
              {s.name}
              <span className="block text-neutral-500">
                {formatPrice(s.price_cents, s.currency)} · {s.duration_minutes} min
              </span>
            </span>
            <button onClick={() => toggleActive(s)} className="text-xs text-neutral-500 underline">
              {s.active ? "Deactivate" : "Activate"}
            </button>
          </li>
        ))}
        {services.length === 0 && (
          <li className="text-sm text-neutral-500">
            No services yet — add what premium clients can book.
          </li>
        )}
      </ul>

      {adding ? (
        <form onSubmit={add} className="mt-4 space-y-3 border border-neutral-800 p-4">
          <label className="block text-sm">
            Service name
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
              placeholder="At-home cut & style"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Price (USD)
              <input
                required
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Duration (minutes)
              <input
                required
                type="number"
                min="5"
                step="5"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
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
              {saving ? "Saving…" : "Add service"}
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
          + Add service
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
