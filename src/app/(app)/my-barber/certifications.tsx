"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { uploadBarberCert } from "@/lib/storage";
import { formatDate } from "@/lib/format";

type Certification = Database["public"]["Tables"]["barber_certifications"]["Row"];

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900";

export function CertificationsManager({
  barberId,
  initial,
}: {
  barberId: string;
  initial: Certification[];
}) {
  const [certs, setCerts] = useState(initial);
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    try {
      const { data: cert, error: insertError } = await supabase
        .from("barber_certifications")
        .insert({
          barber_id: barberId,
          title: title.trim(),
          issuer: issuer.trim(),
          issued_on: issuedOn || null,
        })
        .select("*")
        .single();
      if (insertError) throw new Error(insertError.message);

      let saved = cert;
      if (file) {
        const path = await uploadBarberCert(barberId, cert.id, file, null);
        const { data: updated, error: updateError } = await supabase
          .from("barber_certifications")
          .update({ file_path: path })
          .eq("id", cert.id)
          .select("*")
          .single();
        if (updateError) throw new Error(updateError.message);
        saved = updated;
      }
      setCerts([...certs, saved]);
      setTitle("");
      setIssuer("");
      setIssuedOn("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add certification.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(cert: Certification) {
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("barber_certifications")
      .delete()
      .eq("id", cert.id);
    if (!error && cert.file_path) {
      await supabase.storage.from("barber-certs").remove([cert.file_path]);
    }
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setCerts(certs.filter((c) => c.id !== cert.id));
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    setFile(e.target.files?.[0] ?? null);
  }

  return (
    <section>
      <h2 className="text-lg font-medium">Certifications</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Diplomas, licenses, and courses. The Guild team verifies documents —
        verified certifications get a badge on your public profile.
      </p>

      {certs.length > 0 && (
        <ul className="mt-4 space-y-2">
          {certs.map((c) => (
            <li
              key={c.id}
              className="flex items-baseline justify-between gap-3 rounded border border-neutral-300 p-3 text-sm"
            >
              <div>
                <strong>{c.title}</strong>
                {c.verified_at ? (
                  <span className="ml-2 text-xs font-medium text-emerald-700">
                    ✓ Verified
                  </span>
                ) : (
                  <span className="ml-2 text-xs text-neutral-500">
                    Pending verification
                  </span>
                )}
                <p className="text-neutral-600">
                  {c.issuer}
                  {c.issued_on ? ` · ${formatDate(c.issued_on)}` : ""}
                  {c.file_path ? " · document attached" : ""}
                </p>
              </div>
              <button
                disabled={busy}
                onClick={() => remove(c)}
                className="shrink-0 text-xs text-red-600 underline disabled:opacity-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 space-y-3 rounded border border-neutral-300 p-3">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Title
            <input
              required
              maxLength={120}
              placeholder="Master Barber Diploma"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Issuer
            <input
              required
              maxLength={120}
              placeholder="Miami Barber Academy"
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            Issued on
            <input
              type="date"
              value={issuedOn}
              onChange={(e) => setIssuedOn(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            Document (JPEG/PNG/WebP/PDF, optional)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={onFile}
              className="mt-1 w-full text-xs"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={busy || !title.trim() || !issuer.trim()}
          className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {busy ? "Adding…" : "Add certification"}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </section>
  );
}
