"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

type LinkRow = Database["public"]["Tables"]["barber_links"]["Row"];
type Kind = Database["public"]["Enums"]["barber_link_kind"];

const KINDS: { kind: Kind; label: string; placeholder: string }[] = [
  { kind: "instagram", label: "Instagram", placeholder: "https://instagram.com/yourhandle" },
  { kind: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@yourhandle" },
  { kind: "youtube", label: "YouTube", placeholder: "https://youtube.com/@yourchannel" },
  { kind: "x", label: "X (Twitter)", placeholder: "https://x.com/yourhandle" },
  { kind: "website", label: "Website", placeholder: "https://yoursite.com" },
  { kind: "booking", label: "External booking (e.g. Squire)", placeholder: "https://getsquire.com/booking/..." },
];

export function SocialLinks({ barberId, initial }: { barberId: string; initial: LinkRow[] }) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(KINDS.map(({ kind }) => [kind, initial.find((l) => l.kind === kind)?.url ?? ""]))
  );
  const [bookingLabel, setBookingLabel] = useState(
    initial.find((l) => l.kind === "booking")?.label ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    for (const { kind, label } of KINDS) {
      const v = values[kind].trim();
      if (v && !v.startsWith("https://")) {
        setError(`${label}: the link must start with https://`);
        return;
      }
    }
    setSaving(true);
    const supabase = createClient();
    const { error: delErr } = await supabase.from("barber_links").delete().eq("barber_id", barberId);
    if (delErr) {
      setSaving(false);
      setError(delErr.message);
      return;
    }
    const rows = KINDS.filter(({ kind }) => values[kind].trim()).map(({ kind }) => ({
      barber_id: barberId,
      kind,
      url: values[kind].trim(),
      label: kind === "booking" && bookingLabel.trim() ? bookingLabel.trim() : null,
    }));
    if (rows.length) {
      const { error: insErr } = await supabase.from("barber_links").insert(rows);
      if (insErr) {
        setSaving(false);
        setError(insErr.message);
        return;
      }
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Social links</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Your Guild profile is your one link in the bio. Add your socials — and if you take
        bookings elsewhere (like Squire), link it: your profile works for you either way.
      </p>
      <div className="mt-4 space-y-3">
        {KINDS.map(({ kind, label, placeholder }) => (
          <label key={kind} className="block text-sm">
            {label}
            <input
              type="url"
              value={values[kind]}
              onChange={(e) => {
                setValues((v) => ({ ...v, [kind]: e.target.value }));
                setSaved(false);
              }}
              placeholder={placeholder}
              className="mt-1 w-full border border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-guild-yellow"
            />
          </label>
        ))}
        {values.booking.trim() && (
          <label className="block text-sm">
            Booking button text
            <input
              type="text"
              maxLength={60}
              value={bookingLabel}
              onChange={(e) => setBookingLabel(e.target.value)}
              placeholder="Book on Squire"
              className="mt-1 w-full border border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-guild-yellow"
            />
          </label>
        )}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save links"}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved.</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </section>
  );
}
