import Link from "next/link";
import { LEGAL_VERSIONS } from "@/lib/legal";

export const metadata = { title: "Terms & Conditions — The Guild" };

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 bg-guild-bone px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-yellow-600">
        The Guild — Grooming Standard
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Terms &amp; Conditions</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Version {LEGAL_VERSIONS.terms}
      </p>

      {/* PLACEHOLDER v1 — replace with counsel-reviewed text before launch.
          Bump LEGAL_VERSIONS.terms when the content changes. */}
      <div className="mt-8 space-y-6 text-sm leading-6 text-neutral-700">
        <section>
          <h2 className="font-semibold text-neutral-900">1. The service</h2>
          <p>
            The Guild connects clients with barbershops and independent barbers
            for grooming services, and operates grooming activations at events.
            The Guild facilitates bookings; services are performed by the
            barbershop or barber you select.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">2. Accounts</h2>
          <p>
            You must provide accurate information and keep your account
            credentials secure. One account per person. Accounts may be
            suspended for misuse, no-shows, or fraudulent activity.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">3. Bookings</h2>
          <p>
            Bookings are commitments to the barber&apos;s time. Cancellation
            and no-show policies are shown at booking time and may vary by
            barbershop or barber.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">4. Your content</h2>
          <p>
            Photos you upload (profile and style reference photos) remain
            yours. You grant The Guild a limited license to store and display
            them to you and to barbers fulfilling your bookings, as described
            in the <Link href="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">5. Liability</h2>
          <p>
            Services are provided by independent businesses and professionals.
            To the maximum extent permitted by law, The Guild is not liable for
            the outcome of grooming services.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">6. Contact</h2>
          <p>Questions: ekinoxis.evm@gmail.com</p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">← Back</Link>
      </p>
    </main>
  );
}
