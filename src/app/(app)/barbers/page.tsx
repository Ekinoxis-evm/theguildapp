import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Barbers — The Guild" };

export default async function BarbersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/barbers");

  // Barber-centric directory (2026-07-14): every approved barber is listed
  // and viewable; premium only gates the at-home booking itself.
  const [{ data: profile }, { data: barbers }] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    supabase
      .from("private_barbers")
      .select(
        "profile_id, bio, headline, specialties, years_experience, offers_home_service, self_photo_path, base_price_cents, services_fulfilled_count, coverage_areas(city, state), profiles!private_barbers_profile_id_fkey(first_name, last_name), barber_certifications(id, verified_at), barber_affiliations(ended_on, barbershops(name))"
      )
      .eq("status", "approved")
      .order("services_fulfilled_count", { ascending: false }),
  ]);

  const isPremium = profile?.tier === "premium";

  const enriched = [];
  for (const barber of barbers ?? []) {
    let photoUrl: string | null = null;
    if (barber.self_photo_path) {
      const { data } = await supabase.storage
        .from("barber-photos")
        .createSignedUrl(barber.self_photo_path, SIGNED_URL_TTL_SECONDS);
      photoUrl = data?.signedUrl ?? null;
    }
    enriched.push({ ...barber, photoUrl });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Barbers</h1>
      <p className="mt-1 text-sm text-neutral-500">
        The professionals of The Guild — browse profiles, certifications, and
        track records.
      </p>

      {!isPremium && (
        <p className="mt-4 border border-guild-yellow/40 p-3 text-sm">
          At-home booking is a <strong>premium</strong> feature.{" "}
          <Link href="/premium" className="font-medium underline">
            Upgrade for $19.99/month →
          </Link>
        </p>
      )}

      <ul className="mt-8 space-y-3">
        {enriched.map((b) => {
          const name =
            [b.profiles?.first_name, b.profiles?.last_name].filter(Boolean).join(" ") ||
            "Guild barber";
          const cities = [
            ...new Set(b.coverage_areas.map((c) => `${c.city}, ${c.state}`)),
          ].join(" · ");
          const verifiedCount = b.barber_certifications.filter(
            (c) => c.verified_at
          ).length;
          const currentShop = b.barber_affiliations.find(
            (a) => !a.ended_on
          )?.barbershops?.name;
          return (
            <li key={b.profile_id} className="border border-neutral-800 p-4">
              <div className="flex items-start gap-4">
                {b.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL
                  <img
                    src={b.photoUrl}
                    alt={name}
                    className="h-16 w-16 shrink-0 rounded-full border border-neutral-800 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-full border border-neutral-800 bg-neutral-800" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">{name}</p>
                    <p className="shrink-0 text-xs text-guild-yellow">
                      {b.services_fulfilled_count} services
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-400">
                    {b.headline ??
                      (b.bio ? b.bio.slice(0, 80) : "Guild professional")}
                  </p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {[
                      currentShop ? `at ${currentShop}` : null,
                      b.years_experience != null
                        ? `${b.years_experience} yrs`
                        : null,
                      verifiedCount > 0
                        ? `✓ ${verifiedCount} verified cert${verifiedCount > 1 ? "s" : ""}`
                        : null,
                      b.offers_home_service
                        ? `at-home from ${formatPrice(b.base_price_cents)}`
                        : null,
                      cities || null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                  {b.specialties.length > 0 && (
                    <p className="mt-1.5 flex flex-wrap gap-1">
                      {b.specialties.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="rounded-full border border-neutral-800 px-2 py-0.5 text-xs text-neutral-400"
                        >
                          {s}
                        </span>
                      ))}
                    </p>
                  )}
                  <Link
                    href={`/barbers/${b.profile_id}`}
                    className="mt-2 inline-block bg-guild-yellow px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-guild-black"
                  >
                    View profile
                  </Link>
                </div>
              </div>
            </li>
          );
        })}
        {enriched.length === 0 && (
          <li className="text-sm text-neutral-500">No barbers live yet.</li>
        )}
      </ul>
    </main>
  );
}
