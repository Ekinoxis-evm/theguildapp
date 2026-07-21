import { LeadForm } from "./lead-form";

export const metadata = { title: "Partner with The Guild — Event Activations" };

export default function PartnersPage() {
  return (
    <main className="mx-auto w-full max-w-md flex-1 bg-guild-black px-6 py-16 text-white">
      <p className="text-xs uppercase tracking-widest text-guild-yellow">
        The Guild — Grooming Standard
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Event activations for brands</h1>
      <p className="mt-3 text-sm text-neutral-400">
        Premium grooming experiences at your event — proven at CrossFit Games,
        Jack Daniel&apos;s, and the Miami Open. Tell us about your activation
        and our team will reach out.
      </p>
      <LeadForm />
    </main>
  );
}
