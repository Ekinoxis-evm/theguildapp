"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TierManager() {
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<"premium" | "standard">("premium");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.rpc("set_client_tier", {
      user_email: email.trim(),
      new_tier: tier,
    });
    setSaving(false);
    if (error) {
      setMessage({ ok: false, text: error.message });
      return;
    }
    setMessage({ ok: true, text: `${email.trim()} is now ${tier}.` });
    setEmail("");
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-medium">Client tier</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Premium unlocks at-home bookings. Manual until Stripe subscriptions land.
      </p>
      <form onSubmit={submit} className="mt-3 flex gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@email.com"
          className="w-full border border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-guild-yellow"
        />
        <select
          value={tier}
          onChange={(e) => setTier(e.target.value as "premium" | "standard")}
          className="shrink-0 border border-neutral-800 px-2 py-2 text-sm"
        >
          <option value="premium">premium</option>
          <option value="standard">standard</option>
        </select>
        <button
          type="submit"
          disabled={saving}
          className="shrink-0 bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
        >
          {saving ? "…" : "Set"}
        </button>
      </form>
      {message && (
        <p className={`mt-2 text-sm ${message.ok ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </section>
  );
}
