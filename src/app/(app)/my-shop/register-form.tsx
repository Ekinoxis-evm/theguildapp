"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900";

export function RegisterShopForm({ ownerId }: { ownerId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("barbershops").insert({
      owner_id: ownerId,
      name: name.trim(),
      phone: phone.trim() || null,
      description: description.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm">
        Shop name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm">
        Business phone
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
      </label>
      <label className="block text-sm">
        Description
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
      >
        {saving ? "Submitting…" : "Submit application"}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
