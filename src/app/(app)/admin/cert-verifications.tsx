"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";

type PendingCert = {
  id: string;
  title: string;
  issuer: string;
  issued_on: string | null;
  created_at: string;
  barberName: string;
  docUrl: string | null;
};

export function CertVerifications({ initial }: { initial: PendingCert[] }) {
  const [certs, setCerts] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify(cert: PendingCert) {
    setError(null);
    setBusy(cert.id);
    const supabase = createClient();
    const { error } = await supabase.rpc("verify_certification", {
      cert_id: cert.id,
    });
    setBusy(null);
    if (error) {
      setError(error.message);
      return;
    }
    setCerts(certs.filter((c) => c.id !== cert.id));
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-medium">Certification verifications</h2>
      {certs.length === 0 ? (
        <p className="mt-3 text-sm text-neutral-500">Nothing pending.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {certs.map((c) => (
            <li key={c.id} className="rounded border border-neutral-300 p-4 text-sm">
              <div className="flex items-start justify-between gap-3">
                <span>
                  <strong>{c.title}</strong>
                  <span className="block text-neutral-500">
                    {c.barberName} · {c.issuer}
                    {c.issued_on ? ` · issued ${formatDate(c.issued_on)}` : ""} ·
                    submitted {formatDate(c.created_at)}
                  </span>
                  {c.docUrl ? (
                    <a
                      href={c.docUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs underline"
                    >
                      View document
                    </a>
                  ) : (
                    <span className="mt-1 block text-xs text-neutral-400">
                      No document attached
                    </span>
                  )}
                </span>
                <button
                  disabled={busy === c.id}
                  onClick={() => verify(c)}
                  className="shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  {busy === c.id ? "Verifying…" : "Verify"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
