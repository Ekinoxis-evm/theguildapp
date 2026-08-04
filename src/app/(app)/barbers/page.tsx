import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { formatPrice } from "@/lib/format";
import { STYLE_TAGS } from "@/lib/style-tags";
import { Stars } from "@/components/rating";

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
    supabase.from("profiles").select("tier, city, style_preferences").eq("id", user.id).single(),
    supabase
      .from("private_barbers")
      .select(
        "profile_id, bio, headline, specialties, years_experience, offers_home_service, self_photo_path, base_price_cents, services_fulfilled_count, coverage_areas(city, state), profiles!private_barbers_profile_id_fkey(first_name, last_name), barber_certifications(id, verified_at), barber_affiliations(ended_on, barbershops(name))"
      )
      .eq("status", "approved")
      .order("services_fulfilled_count", { ascending: false }),
  ]);

  const isPremium = profile?.tier === "premium";

  // Matching v1 (roadmap 8.3): rank barbers for this client by shared style
  // tags, verified rating, city coverage, and track record. Transparent
  // scoring — each match says why.
  const { data: barberReviews } = await supabase
    .from("reviews")
    .select("private_barber_id, rating")
    .not("private_barber_id", "is", null);
  const ratingByBarber = new Map<string, { sum: number; n: number }>();
  for (const r of barberReviews ?? []) {
    if (!r.private_barber_id) continue;
    const cur = ratingByBarber.get(r.private_barber_id) ?? { sum: 0, n: 0 };
    cur.sum += r.rating;
    cur.n += 1;
    ratingByBarber.set(r.private_barber_id, cur);
  }
  const prefs = (profile?.style_preferences ?? []).map((v) => v.toLowerCase());
  const tagLabel = (v: string) => STYLE_TAGS.find((t) => t.value === v)?.label ?? v;
  const matches = prefs.length
    ? (barbers ?? [])
        .map((b) => {
          const specs = (b.specialties ?? []).map((v: string) => v.toLowerCase());
          const shared = prefs.filter((t) => specs.includes(t));
          const rating = ratingByBarber.get(b.profile_id);
          const avg = rating ? rating.sum / rating.n : 0;
          const cityMatch = Boolean(
            profile?.city &&
              b.coverage_areas?.some(
                (c: { city: string }) =>
                  c.city.toLowerCase() === profile.city!.toLowerCase()
              )
          );
          const score =
            shared.length * 3 +
            avg * 2 +
            (cityMatch ? 2 : 0) +
            Math.log10((b.services_fulfilled_count ?? 0) + 1);
          return { barber: b, shared, avg, ratingCount: rating?.n ?? 0, cityMatch, score };
        })
        .filter((m) => m.shared.length > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
    : [];


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

      {matches.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-guild-yellow">
            For you
          </h2>
          <div className="mt-3 space-y-2">
            {matches.map(({ barber, shared, avg, ratingCount, cityMatch }) => (
              <Link
                key={barber.profile_id}
                href={`/barbers/${barber.profile_id}`}
                className="block border border-guild-yellow/40 p-3 hover:border-guild-yellow"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <strong className="text-sm">
                    {[barber.profiles?.first_name, barber.profiles?.last_name]
                      .filter(Boolean)
                      .join(" ") || "Guild barber"}
                  </strong>
                  {ratingCount > 0 && (
                    <span className="text-xs">
                      <Stars value={avg} /> {avg.toFixed(1)}
                    </span>
                  )}
                </div>
                {barber.headline && (
                  <p className="mt-0.5 text-xs text-neutral-400">{barber.headline}</p>
                )}
                <p className="mt-1.5 text-xs text-neutral-500">
                  Matches {shared.map(tagLabel).join(" · ")}
                  {cityMatch ? " · covers your city" : ""}
                </p>
              </Link>
            ))}
          </div>
        </section>
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
                    className="btn btn-primary mt-2 px-3 py-1.5 text-xs"
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
