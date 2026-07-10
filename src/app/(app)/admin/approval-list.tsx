"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";

type PendingShop = {
  id: string;
  name: string;
  phone: string | null;
  description: string | null;
  created_at: string;
  owner_id: string;
};

export function ApprovalList({ initial }: { initial: PendingShop[] }) {
  const [shops, setShops] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function approve(shop: PendingShop) {
    setError(null);
    setBusy(shop.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("approve_barbershop", { shop_id: shop.id });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setShops(shops.filter((s) => s.id !== shop.id));
  }

  if (shops.length === 0) {
    return <p className="mt-6 text-sm text-neutral-500">No pending applications.</p>;
  }

  return (
    <div>
      <ul className="mt-6 space-y-3">
        {shops.map((s) => (
          <li key={s.id} className="rounded border border-neutral-300 p-4 text-sm">
            <div className="flex items-start justify-between gap-3">
              <span>
                <strong>{s.name}</strong>
                <span className="block text-neutral-500">
                  Applied {formatDate(s.created_at)}
                  {s.phone ? ` · ${s.phone}` : ""}
                </span>
                {s.description && <span className="mt-1 block">{s.description}</span>}
              </span>
              <button
                disabled={busy === s.id}
                onClick={() => approve(s)}
                className="shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {busy === s.id ? "Approving…" : "Approve"}
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
