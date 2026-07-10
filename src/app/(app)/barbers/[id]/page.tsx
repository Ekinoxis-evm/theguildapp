import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Private barber — The Guild" };

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

  const [{ data: profile }, { data: barber }] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    supabase
      .from("private_barbers")
      .select(
        "profile_id, bio, self_photo_path, setup_photo_path, base_price_cents, services_fulfilled_count, coverage_areas(city, state, zip_codes), services(id, name, price_cents, currency, duration_minutes, active), profiles!private_barbers_profile_id_fkey(first_name, last_name)"
      )
      .eq("profile_id", id)
      .eq("status", "approved")
      .maybeSingle(),
  ]);
  if (!barber) notFound();
  if (profile?.tier !== "premium") redirect("/barbers");

  const name =
    [barber.profiles?.first_name, barber.profiles?.last_name].filter(Boolean).join(" ") ||
    "Guild barber";
  const services = barber.services.filter((s) => s.active);

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
          ← All private barbers
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{name}</h1>
      <p className="mt-1 text-sm text-yellow-600">
        {barber.services_fulfilled_count} services fulfilled · from{" "}
        {formatPrice(barber.base_price_cents)}
      </p>
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

      <h2 className="mt-8 text-lg font-medium">Services</h2>
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
            <Link
              href={`/barbers/${barber.profile_id}/book?service=${s.id}`}
              className="shrink-0 rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Book
            </Link>
          </li>
        ))}
        {services.length === 0 && (
          <li className="text-sm text-neutral-500">No bookable services yet.</li>
        )}
      </ul>
    </main>
  );
}
