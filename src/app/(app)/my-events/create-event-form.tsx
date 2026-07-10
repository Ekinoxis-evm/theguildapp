"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function CreateEventForm({ managerId }: { managerId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    brand_name: "",
    title: "",
    venue: "",
    starts_at: "",
    ends_at: "",
  });

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("events").insert({
      manager_id: managerId,
      brand_name: form.brand_name.trim(),
      title: form.title.trim(),
      venue: form.venue.trim(),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setOpen(false);
    setForm({ brand_name: "", title: "", venue: "", starts_at: "", ends_at: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-6 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
      >
        + Create event
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded border border-neutral-300 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Brand
          <input
            required
            value={form.brand_name}
            onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Event title
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm">
        Venue
        <input
          required
          value={form.venue}
          onChange={(e) => setForm({ ...form, venue: e.target.value })}
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Starts
          <input
            required
            type="datetime-local"
            value={form.starts_at}
            onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Ends
          <input
            required
            type="datetime-local"
            value={form.ends_at}
            onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create draft"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded border border-neutral-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
