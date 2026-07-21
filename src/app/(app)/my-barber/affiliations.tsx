"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatDate } from "@/lib/format";

type Affiliation = Database["public"]["Tables"]["barber_affiliations"]["Row"] & {
  barbershops: { name: string } | null;
};

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function AffiliationsManager({
  barberId,
  shops,
  initial,
}: {
  barberId: string;
  shops: { id: string; name: string }[];
  initial: Affiliation[];
}) {
  const [affiliations, setAffiliations] = useState(initial);
  const [shopId, setShopId] = useState(shops[0]?.id ?? "");
  const [roleTitle, setRoleTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = affiliations.filter((a) => !a.ended_on);
  const past = affiliations.filter((a) => a.ended_on);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("barber_affiliations")
      .insert({
        barber_id: barberId,
        barbershop_id: shopId,
        role_title: roleTitle.trim() || null,
      })
      .select("*, barbershops(name)")
      .single();
    setBusy(false);
    if (error) {
      setError(
        error.message.includes("barber_affiliations_current_key")
          ? "You already have an open enrollment with that shop."
          : error.message
      );
      return;
    }
    setAffiliations([...affiliations, data]);
    setRoleTitle("");
  }

  async function end(affiliation: Affiliation) {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const endedOn = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from("barber_affiliations")
      .update({ ended_on: endedOn })
      .eq("id", affiliation.id);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setAffiliations(
      affiliations.map((a) =>
        a.id === affiliation.id ? { ...a, ended_on: endedOn } : a
      )
    );
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Barbershop enrollment</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Optional — show clients where you work. Independent barbers can leave
        this empty.
      </p>

      {current.length > 0 && (
        <ul className="mt-4 space-y-2">
          {current.map((a) => (
            <li
              key={a.id}
              className="flex items-baseline justify-between gap-3 border border-neutral-800 p-3 text-sm"
            >
              <div>
                <strong>{a.barbershops?.name ?? "Barbershop"}</strong>
                {a.confirmed_at ? (
                  <span className="ml-2 text-xs font-medium text-emerald-400">
                    ✓ Confirmed by shop
                  </span>
                ) : (
                  <span className="ml-2 text-xs text-neutral-500">
                    Awaiting shop confirmation
                  </span>
                )}
                <p className="text-neutral-400">
                  {a.role_title ? `${a.role_title} · ` : ""}since{" "}
                  {formatDate(a.started_on)}
                </p>
              </div>
              <button
                disabled={busy}
                onClick={() => end(a)}
                className="shrink-0 text-xs text-red-400 underline disabled:opacity-50"
              >
                End enrollment
              </button>
            </li>
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-neutral-500">
          {past.map((a) => (
            <li key={a.id}>
              {a.barbershops?.name ?? "Barbershop"}
              {a.role_title ? ` — ${a.role_title}` : ""} ·{" "}
              {formatDate(a.started_on)} → {a.ended_on ? formatDate(a.ended_on) : ""}
            </li>
          ))}
        </ul>
      )}

      {shops.length > 0 ? (
        <form onSubmit={add} className="mt-4 space-y-3 border border-neutral-800 p-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Barbershop
              <select
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                className={inputClass}
              >
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Role (optional)
              <input
                maxLength={80}
                placeholder="Senior barber"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                className={inputClass}
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={busy || !shopId}
            className="bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
          >
            {busy ? "Adding…" : "Add enrollment"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </form>
      ) : (
        <p className="mt-3 text-sm text-neutral-500">
          No approved barbershops to enroll with yet.
        </p>
      )}
    </section>
  );
}
