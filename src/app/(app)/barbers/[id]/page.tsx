import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata = { title: "Barber — The Guild" };

export default async function BarberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/barbers/${id}`);

  // Profiles are public to every signed-in user (barber-centric, 2026-07-14);
  // only the at-home booking action itself is premium-gated.
  const [{ data: profile }, { data: barber }, { data: serviceHistory }] =
    await Promise.all([
      supabase.from("profiles").select("tier").eq("id", user.id).single(),
      supabase
        .from("private_barbers")
        .select(
          "profile_id, bio, headline, years_experience, specialties, offers_home_service, self_photo_path, setup_photo_path, base_price_cents, services_fulfilled_count, coverage_areas(city, state, zip_codes), services(id, name, price_cents, currency, duration_minutes, active), profiles!private_barbers_profile_id_fkey(first_name, last_name), barber_certifications(id, title, issuer, issued_on, verified_at), barber_affiliations(id, role_title, started_on, ended_on, confirmed_at, barbershops(id, name))"
        )
        .eq("profile_id", id)
        .eq("status", "approved")
        .maybeSingle(),
      supabase.rpc("barber_service_history", { p_barber_id: id }),
    ]);
  if (!barber) notFound();

  const isPremium = profile?.tier === "premium";
  const name =
    [barber.profiles?.first_name, barber.profiles?.last_name].filter(Boolean).join(" ") ||
    "Guild barber";
  const services = barber.services.filter((s) => s.active);
  const certifications = [...barber.barber_certifications].sort((a, b) =>
    (b.issued_on ?? "").localeCompare(a.issued_on ?? "")
  );
  const currentShops = barber.barber_affiliations.filter((a) => !a.ended_on);
  const pastShops = barber.barber_affiliations.filter((a) => a.ended_on);

  async function signedUrl(path: string | null) {
    if (!path) return null;
    const { data } = await supabase.storage
      .from("barber-photos")
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
    return data?.signedUrl ?? null;
  }
  const [selfUrl, setupUrl] = await Promise.all([
    signedUrl(barber.self_photo_path),
    signedUrl(barber.setup_photo_path),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/barbers" className="underline">
          ← All barbers
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{name}</h1>
      {barber.headline && (
        <p className="mt-1 text-sm text-neutral-600">{barber.headline}</p>
      )}
      <p className="mt-1 text-sm text-yellow-600">
        {barber.services_fulfilled_count} services fulfilled
        {barber.years_experience != null
          ? ` · ${barber.years_experience} yrs experience`
          : ""}
        {barber.offers_home_service
          ? ` · at-home from ${formatPrice(barber.base_price_cents)}`
          : ""}
      </p>

      {currentShops.length > 0 && (
        <p className="mt-2 text-sm">
          Works at{" "}
          {currentShops.map((a, i) => (
            <span key={a.id}>
              {i > 0 && " · "}
              {a.barbershops ? (
                <Link href={`/shops/${a.barbershops.id}`} className="underline">
                  {a.barbershops.name}
                </Link>
              ) : (
                "a Guild barbershop"
              )}
              {a.role_title ? ` (${a.role_title})` : ""}
              {a.confirmed_at && (
                <span className="ml-1 text-xs font-medium text-emerald-700">
                  ✓ shop-confirmed
                </span>
              )}
            </span>
          ))}
        </p>
      )}

      {barber.specialties.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {barber.specialties.map((s) => (
            <span
              key={s}
              className="rounded-full border border-neutral-300 px-2.5 py-0.5 text-xs text-neutral-700"
            >
              {s}
            </span>
          ))}
        </p>
      )}

      {barber.bio && <p className="mt-3 text-sm text-neutral-600">{barber.bio}</p>}

      <div className="mt-4 grid grid-cols-2 gap-3">
        {selfUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL
          <img src={selfUrl} alt={name} className="aspect-square w-full rounded object-cover" />
        )}
        {setupUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- signed URL
          <img
            src={setupUrl}
            alt="Mobile setup"
            className="aspect-square w-full rounded object-cover"
          />
        )}
      </div>

      {certifications.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-medium">Certifications</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {certifications.map((c) => (
              <li key={c.id} className="rounded border border-neutral-300 p-3">
                <strong>{c.title}</strong>
                {c.verified_at && (
                  <span className="ml-2 text-xs font-medium text-emerald-700">
                    ✓ Verified by The Guild
                  </span>
                )}
                <span className="block text-neutral-500">
                  {c.issuer}
                  {c.issued_on ? ` · ${formatDate(c.issued_on)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {(serviceHistory ?? []).length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-medium">Track record</h2>
          <ul className="mt-3 space-y-1 text-sm text-neutral-600">
            {(serviceHistory ?? []).map((h) => (
              <li key={h.service_name} className="flex justify-between gap-3">
                <span>{h.service_name}</span>
                <span className="text-neutral-500">
                  {h.completed_count} completed
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {pastShops.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-medium">Work history</h2>
          <ul className="mt-3 space-y-1 text-sm text-neutral-600">
            {pastShops.map((a) => (
              <li key={a.id}>
                {a.barbershops?.name ?? "Guild barbershop"}
                {a.role_title ? ` — ${a.role_title}` : ""} ·{" "}
                {formatDate(a.started_on)} → {a.ended_on ? formatDate(a.ended_on) : ""}
              </li>
            ))}
          </ul>
        </>
      )}

      {barber.offers_home_service ? (
        <>
          <h2 className="mt-8 text-lg font-medium">Coverage</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {barber.coverage_areas.map((c, i) => (
              <li key={i} className="rounded border border-neutral-300 p-3">
                {c.city}, {c.state}
                {c.zip_codes.length > 0 && (
                  <span className="block text-neutral-500">Zips: {c.zip_codes.join(", ")}</span>
                )}
              </li>
            ))}
            {barber.coverage_areas.length === 0 && (
              <li className="text-neutral-500">No coverage areas listed.</li>
            )}
          </ul>

          <h2 className="mt-8 text-lg font-medium">At-home services</h2>
          {!isPremium && (
            <p className="mt-2 rounded border border-yellow-600/40 bg-yellow-50 p-3 text-sm">
              At-home booking is a <strong>premium</strong> feature.{" "}
              <Link href="/premium" className="font-medium underline">
                Upgrade for $19.99/month →
              </Link>
            </p>
          )}
          <ul className="mt-3 space-y-2">
            {services.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 rounded border border-neutral-300 p-3 text-sm"
              >
                <span>
                  {s.name}
                  <span className="block text-neutral-500">
                    {formatPrice(s.price_cents, s.currency)} · {s.duration_minutes} min · at your
                    address
                  </span>
                </span>
                {isPremium && (
                  <Link
                    href={`/barbers/${barber.profile_id}/book?service=${s.id}`}
                    className="shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
                  >
                    Book
                  </Link>
                )}
              </li>
            ))}
            {services.length === 0 && (
              <li className="text-sm text-neutral-500">No bookable services yet.</li>
            )}
          </ul>
        </>
      ) : (
        currentShops.length > 0 && (
          <p className="mt-8 rounded border border-neutral-300 p-3 text-sm text-neutral-600">
            Book {name} through{" "}
            {currentShops[0].barbershops ? (
              <Link
                href={`/shops/${currentShops[0].barbershops.id}`}
                className="underline"
              >
                {currentShops[0].barbershops.name}
              </Link>
            ) : (
              "their barbershop"
            )}
            .
          </p>
        )
      )}
    </main>
  );
}
