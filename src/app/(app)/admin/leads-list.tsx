"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { formatDate } from "@/lib/format";

type Lead = Database["public"]["Tables"]["b2b_leads"]["Row"];
type LeadStatus = Database["public"]["Enums"]["lead_status"];

const NEXT: Partial<Record<LeadStatus, { label: string; to: LeadStatus }[]>> = {
  new: [{ label: "Mark contacted", to: "contacted" }],
  contacted: [{ label: "Mark closed", to: "closed" }],
};

export function LeadsList({ initial }: { initial: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [error, setError] = useState<string | null>(null);

  async function transition(lead: Lead, to: LeadStatus) {
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.from("b2b_leads").update({ status: to }).eq("id", lead.id);
    if (error) {
      setError(error.message);
      return;
    }
    setLeads(leads.map((l) => (l.id === lead.id ? { ...l, status: to } : l)));
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-medium">B2B leads</h2>
      {leads.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">No leads yet — share /partners with brands.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {leads.map((l) => (
            <li key={l.id} className="border border-neutral-800 p-3 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <strong>{l.company}</strong>
                <span className="shrink-0 text-xs uppercase tracking-wide text-neutral-500">
                  {l.status}
                </span>
              </div>
              <p className="mt-1 text-neutral-400">
                {l.contact_name} · {l.email}
                {l.phone ? ` · ${l.phone}` : ""} · {formatDate(l.created_at)}
              </p>
              {l.message && <p className="mt-1 text-neutral-500">{l.message}</p>}
              <div className="mt-2 flex gap-2">
                {(NEXT[l.status] ?? []).map((a) => (
                  <button
                    key={a.to}
                    onClick={() => transition(l, a.to)}
                    className="border border-neutral-800 px-2 py-1 text-xs"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </section>
  );
}
