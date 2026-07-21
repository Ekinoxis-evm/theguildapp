"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type Staff = Database["public"]["Tables"]["barbershop_staff"]["Row"];

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

const SKILL_OPTIONS = ["barber", "stylist", "colorist", "beard specialist"];

export function StaffManager({
  shopId,
  initial,
}: {
  shopId: string;
  initial: Staff[];
}) {
  const [staff, setStaff] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    skills: ["barber"] as string[],
  });

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("barbershop_staff")
      .insert({
        barbershop_id: shopId,
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
        skills: form.skills,
      })
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStaff([...staff, data]);
    setAdding(false);
    setForm({ full_name: "", email: "", phone: "", skills: ["barber"] });
  }

  async function remove(id: string) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("barbershop_staff").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setStaff(staff.filter((s) => s.id !== id));
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter((s) => s !== skill)
        : [...f.skills, skill],
    }));
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Staff</h2>
      <p className="mt-1 text-xs text-neutral-500">
        Staff who sign up to The Guild with the same email get access to this
        shop&apos;s bookings automatically.
      </p>
      <ul className="mt-3 space-y-2">
        {staff.map((s) => (
          <li
            key={s.id}
            className="flex items-start justify-between gap-3 border border-neutral-800 p-3 text-sm"
          >
            <span>
              {s.full_name}
              {s.profile_id && (
                <span className="ml-2 bg-guild-yellow px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-guild-black">
                  linked
                </span>
              )}
              <span className="block text-neutral-500">
                {s.email}
                {s.phone ? ` · ${s.phone}` : ""} · {s.skills.join(", ")}
              </span>
            </span>
            <button onClick={() => remove(s.id)} className="text-xs text-neutral-500 underline">
              Remove
            </button>
          </li>
        ))}
        {staff.length === 0 && (
          <li className="text-sm text-neutral-500">No staff on the roster yet.</li>
        )}
      </ul>

      {adding ? (
        <form onSubmit={add} className="mt-4 space-y-3 border border-neutral-800 p-4">
          <label className="block text-sm">
            Full name
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className={inputClass}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              Phone
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-sm">Skills</legend>
            <div className="mt-1 flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <label
                  key={skill}
                  className={`cursor-pointer rounded border px-2 py-1 text-xs ${
                    form.skills.includes(skill)
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.skills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                    className="hidden"
                  />
                  {skill}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || form.skills.length === 0}
              className="bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add staff member"}
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
          + Add staff member
        </button>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
