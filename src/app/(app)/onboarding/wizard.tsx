"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { PHOTO_POSITIONS } from "@/lib/storage";
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

const STEPS = [
  "Profile photo",
  "Your name",
  "Phone",
  "Location",
  "Haircut method",
  "Your style",
] as const;

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900";

export function OnboardingWizard({
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
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
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
  const [stylePhotos, setStylePhotos] =
    useState<StylePhotoState>(initialStylePhotos);

  const allStylePhotosSet = PHOTO_POSITIONS.every((p) => stylePhotos[p]);

  // Each step persists its own fields before advancing, so a user who
  // drops out mid-wizard resumes where they left off.
  async function saveStep(
    fields: Partial<Profile>,
    e?: FormEvent
  ): Promise<void> {
    e?.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep((s) => s + 1);
  }

  async function finish() {
    setError(null);
    if (!allStylePhotosSet) {
      setError("Please add all four photos of your current style.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const continueButton = (
    <button
      type="submit"
      disabled={saving}
      className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {saving ? "Saving…" : "Continue"}
    </button>
  );

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-yellow-600">
        The Guild — Grooming Standard
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{STEPS[step]}</h1>
      <p className="mt-1 text-xs text-neutral-500">
        Step {step + 1} of {STEPS.length}
      </p>

      {step === 0 && (
        <div className="mt-8 space-y-6">
          <AvatarField
            userId={userId}
            initialPath={profile.avatar_path}
            initialUrl={avatarUrl}
          />
          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            Continue
          </button>
        </div>
      )}

      {step === 1 && (
        <form
          onSubmit={(e) =>
            saveStep({ first_name: firstName.trim(), last_name: lastName.trim() }, e)
          }
          className="mt-8 space-y-4"
        >
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
          {continueButton}
        </form>
      )}

      {step === 2 && (
        <form
          onSubmit={(e) => saveStep({ phone: phone.trim() }, e)}
          className="mt-8 space-y-4"
        >
          <label className="block text-sm">
            Phone number
            <input
              type="tel"
              required
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputClass}
              placeholder="+1 305 555 0100"
            />
          </label>
          {continueButton}
        </form>
      )}

      {step === 3 && (
        <form
          onSubmit={(e) =>
            saveStep(
              {
                country: country.trim(),
                state: state.trim(),
                city: city.trim(),
                zip_code: zipCode.trim(),
              },
              e
            )
          }
          className="mt-8 space-y-4"
        >
          <label className="block text-sm">
            Country
            <input
              required
              autoComplete="country-name"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className={inputClass}
              placeholder="United States"
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
              placeholder="Florida"
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
              placeholder="Miami"
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
              placeholder="33101"
            />
          </label>
          {continueButton}
        </form>
      )}

      {step === 4 && (
        <form
          onSubmit={(e) => saveStep({ haircut_method: haircutMethod }, e)}
          className="mt-8 space-y-4"
        >
          <div className="space-y-2">
            {HAIRCUT_METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex cursor-pointer items-center gap-3 rounded border px-4 py-3 text-sm ${
                  haircutMethod === m.value
                    ? "border-neutral-900"
                    : "border-neutral-300"
                }`}
              >
                <input
                  type="radio"
                  name="haircut_method"
                  required
                  checked={haircutMethod === m.value}
                  onChange={() => setHaircutMethod(m.value)}
                />
                {m.label}
              </label>
            ))}
          </div>
          {continueButton}
        </form>
      )}

      {step === 5 && (
        <div className="mt-8 space-y-6">
          <p className="text-sm text-neutral-600">
            Add four photos of your current haircut so your barber knows your
            style: front, left side, right side, and back.
          </p>
          <StylePhotoGrid
            userId={userId}
            initial={stylePhotos}
            onChange={setStylePhotos}
          />
          <button
            type="button"
            onClick={finish}
            disabled={saving || !allStylePhotosSet}
            className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {saving ? "Finishing…" : "Finish"}
          </button>
        </div>
      )}

      {step > 0 && (
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          className="mt-4 w-full text-xs text-neutral-500 underline"
        >
          Back
        </button>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}
