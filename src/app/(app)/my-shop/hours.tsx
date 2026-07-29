"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type HoursRow = Database["public"]["Tables"]["location_hours"]["Row"];

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type DayState = { open: boolean; opens_at: string; closes_at: string };

function toDayState(rows: HoursRow[]): DayState[] {
  return WEEKDAYS.map((_, weekday) => {
    const row = rows.find((r) => r.weekday === weekday);
    return row
      ? { open: true, opens_at: row.opens_at.slice(0, 5), closes_at: row.closes_at.slice(0, 5) }
      : { open: false, opens_at: "10:00", closes_at: "19:00" };
  });
}

export function HoursEditor({
  locationId,
  label,
  initial,
}: {
  locationId: string;
  label: string;
  initial: HoursRow[];
}) {
  const [days, setDays] = useState<DayState[]>(() => toDayState(initial));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setDay(i: number, patch: Partial<DayState>) {
    setDays((d) => d.map((day, idx) => (idx === i ? { ...day, ...patch } : day)));
    setSaved(false);
  }

  async function save() {
    setError(null);
    for (let i = 0; i < 7; i++) {
      if (days[i].open && days[i].closes_at <= days[i].opens_at) {
        setError(`${WEEKDAYS[i]}: closing time must be after opening time.`);
        return;
      }
    }
    setSaving(true);
    const supabase = createClient();
    const { error: delErr } = await supabase
      .from("location_hours")
      .delete()
      .eq("location_id", locationId);
    if (delErr) {
      setSaving(false);
      setError(delErr.message);
      return;
    }
    const rows = days
      .map((d, weekday) => ({ day: d, weekday }))
      .filter(({ day }) => day.open)
      .map(({ day, weekday }) => ({
        location_id: locationId,
        weekday,
        opens_at: day.opens_at,
        closes_at: day.closes_at,
      }));
    if (rows.length) {
      const { error: insErr } = await supabase.from("location_hours").insert(rows);
      if (insErr) {
        setSaving(false);
        setError(insErr.message);
        return;
      }
    }
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="mt-4 border border-neutral-800 p-4">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">
        Opening hours — {label}
      </p>
      <p className="mt-1 text-xs text-neutral-500">
        Clients can only book inside these hours. Leave every day off to allow any time
        (not recommended).
      </p>
      <div className="mt-3 space-y-2">
        {WEEKDAYS.map((name, i) => (
          <div key={name} className="flex items-center gap-3 text-sm">
            <label className="flex w-32 items-center gap-2">
              <input
                type="checkbox"
                checked={days[i].open}
                onChange={(e) => setDay(i, { open: e.target.checked })}
              />
              {name}
            </label>
            {days[i].open ? (
              <>
                <input
                  type="time"
                  value={days[i].opens_at}
                  onChange={(e) => setDay(i, { opens_at: e.target.value })}
                  className="border border-neutral-700 bg-transparent px-2 py-1 text-sm outline-none focus:border-guild-yellow"
                />
                <span className="text-neutral-500">to</span>
                <input
                  type="time"
                  value={days[i].closes_at}
                  onChange={(e) => setDay(i, { closes_at: e.target.value })}
                  className="border border-neutral-700 bg-transparent px-2 py-1 text-sm outline-none focus:border-guild-yellow"
                />
              </>
            ) : (
              <span className="text-neutral-600">Closed</span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save hours"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved.</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  );
}
