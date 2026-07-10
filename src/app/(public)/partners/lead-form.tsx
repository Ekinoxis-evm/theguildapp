"use client";

import { FormEvent, useState } from "react";
import { submitLead } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-neutral-300 px-3 py-2 text-base outline-none focus:border-neutral-900";

export function LeadForm() {
  const [form, setForm] = useState({
    company: "",
    contactName: "",
    email: "",
    phone: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await submitLead(form);
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="mt-8 rounded border border-neutral-300 p-4 text-sm">
        Thanks — our team will contact you shortly.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label className="block text-sm">
        Company
        <input
          required
          value={form.company}
          onChange={(e) => setForm({ ...form, company: e.target.value })}
          className={inputClass}
        />
      </label>
      <label className="block text-sm">
        Contact name
        <input
          required
          value={form.contactName}
          onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          Email
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputClass}
          />
        </label>
        <label className="block text-sm">
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-sm">
        Tell us about your event
        <textarea
          rows={4}
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          className={inputClass}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? "Sending…" : "Request a call"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
