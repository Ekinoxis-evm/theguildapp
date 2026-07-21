"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import {
  AvatarField,
  StylePhotoGrid,
  type StylePhotoState,
} from "@/components/profile/photo-fields";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type HaircutMethod = Database["public"]["Enums"]["haircut_method"];

const HAIRCUT_METHODS: { value: HaircutMethod; label: string }[] = [
  { value: "scissors", label: "Scissors" },
  { value: "machine", label: "Machine" },
  { value: "mixed", label: "Mixed" },
];

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900";

export function ProfileForm({
  userId,
  profile,
  avatarUrl,
  initialStylePhotos,
}: {
  userId: string;
  profile: Profile;
  avatarUrl: string | null;
  initialStylePhotos: StylePhotoState;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState(profile.first_name ?? "");
  const [lastName, setLastName] = useState(profile.last_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [state, setState] = useState(profile.state ?? "");
  const [city, setCity] = useState(profile.city ?? "");
  const [zipCode, setZipCode] = useState(profile.zip_code ?? "");
  const [haircutMethod, setHaircutMethod] = useState<HaircutMethod | null>(
    profile.haircut_method
  );

  async function save(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        country: country.trim(),
        state: state.trim(),
        city: city.trim(),
        zip_code: zipCode.trim(),
        haircut_method: haircutMethod,
      })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="mt-8 space-y-12">
      <section>
        <h2 className="text-lg font-medium">Personal info</h2>
        <div className="mt-4">
          <AvatarField
            userId={userId}
            initialPath={profile.avatar_path}
            initialUrl={avatarUrl}
          />
        </div>
        <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            First name
            <input
              required
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Last name
            <input
              required
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            Phone number
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Country
            <input
              required
              autoComplete="country-name"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            State
            <input
              required
              autoComplete="address-level1"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            City
            <input
              required
              autoComplete="address-level2"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Zip code
            <input
              required
              autoComplete="postal-code"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className={inputClass}
            />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm">Haircut method</legend>
            <div className="mt-2 flex gap-3">
              {HAIRCUT_METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex cursor-pointer items-center gap-2 rounded border px-3 py-2 text-sm ${
                    haircutMethod === m.value
                      ? "border-neutral-900"
                      : "border-neutral-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="haircut_method"
                    checked={haircutMethod === m.value}
                    onChange={() => setHaircutMethod(m.value)}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-guild-yellow px-4 py-2 text-sm font-bold uppercase tracking-wide text-guild-black disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="ml-3 text-sm text-green-400">Saved.</span>
            )}
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-lg font-medium">My Style</h2>
        <p className="mt-1 text-sm text-neutral-400">
          Keep these four photos current — you&apos;ll confirm them each time
          you book.
        </p>
        <div className="mt-4 max-w-sm">
          <StylePhotoGrid userId={userId} initial={initialStylePhotos} />
        </div>
      </section>
    </div>
  );
}
