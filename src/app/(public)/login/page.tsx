"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LEGAL_VERSIONS } from "@/lib/legal";

const GOOGLE_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep("code");
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    // Record legal acceptance for the current document versions.
    // Unique constraint makes this idempotent across sign-ins.
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;
    if (userId) {
      await supabase.from("legal_acceptances").upsert(
        [
          {
            profile_id: userId,
            document: "terms" as const,
            version: LEGAL_VERSIONS.terms,
          },
          {
            profile_id: userId,
            document: "privacy" as const,
            version: LEGAL_VERSIONS.privacy,
          },
        ],
        { onConflict: "profile_id,document,version", ignoreDuplicates: true }
      );
    }
    router.push(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-yellow-600">
        The Guild — Grooming Standard
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Sign in or create account</h1>

      {step === "email" ? (
        <form onSubmit={sendCode} className="mt-8 space-y-4">
          <label className="block text-sm">
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900"
              placeholder="you@example.com"
            />
          </label>

          <label className="flex items-start gap-2 text-xs text-neutral-600">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5"
            />
            <span>
              I accept the{" "}
              <Link href="/terms" className="underline" target="_blank">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline" target="_blank">
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Sending code…" : "Send me a code"}
          </button>

          {GOOGLE_AUTH_ENABLED && (
            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full rounded border border-neutral-300 px-4 py-2 text-sm font-medium"
            >
              Continue with Google
            </button>
          )}
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <p className="text-sm text-neutral-600">
            We sent a 6-digit code to <strong>{email}</strong>.
          </p>
          <label className="block text-sm">
            Code
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-center text-lg tracking-[0.5em] outline-none focus:border-neutral-900"
              placeholder="••••••"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
            }}
            className="w-full text-xs text-neutral-500 underline"
          >
            Use a different email
          </button>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
