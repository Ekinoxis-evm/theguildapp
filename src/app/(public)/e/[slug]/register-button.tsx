"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function RegisterButton({
  eventId,
  userId,
}: {
  eventId: string;
  userId: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function register() {
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("event_registrations")
      .insert({ event_id: eventId, profile_id: userId });
    setSaving(false);
    if (error && error.code !== "23505") {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-8">
      <button
        onClick={register}
        disabled={saving}
        className="w-full bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
      >
        {saving ? "Registering…" : "Register for this event"}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
