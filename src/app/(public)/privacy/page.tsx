import Link from "next/link";
import { LEGAL_VERSIONS } from "@/lib/legal";

export const metadata = { title: "Privacy Policy — The Guild" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-yellow-600">
        The Guild — Grooming Standard
      </p>
      <h1 className="mt-2 text-3xl font-semibold">Privacy Policy</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Version {LEGAL_VERSIONS.privacy}
      </p>

      {/* PLACEHOLDER v1 — replace with counsel-reviewed text before launch.
          Bump LEGAL_VERSIONS.privacy when the content changes. */}
      <div className="mt-8 space-y-6 text-sm leading-6 text-neutral-700">
        <section>
          <h2 className="font-semibold text-neutral-900">1. What we collect</h2>
          <p>
            Account data (name, email, phone), general location (country,
            state, city, zip code), grooming preferences, and photos you choose
            to upload (profile picture and style reference photos). Premium
            members who request at-home service additionally provide a street
            address.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">2. How we use it</h2>
          <p>
            To operate bookings: your style photos and relevant details are
            shared only with the barbershop or barber fulfilling a booking you
            made. Your street address is shared only with the barber serving an
            at-home appointment you booked. We do not sell personal data.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">3. How it is protected</h2>
          <p>
            Photos are stored in private storage accessible only through
            short-lived signed links. Database access is restricted row-by-row
            so each account can only read its own records. Data is encrypted in
            transit and at rest.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">4. Your rights</h2>
          <p>
            You can update or delete your photos and personal information at
            any time from your profile. You may request account deletion or a
            copy of your data at ekinoxis.evm@gmail.com.
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-neutral-900">5. Contact</h2>
          <p>ekinoxis.evm@gmail.com</p>
        </section>
      </div>

      <p className="mt-10 text-sm">
        <Link href="/" className="underline">← Back</Link>
      </p>
    </main>
  );
}
