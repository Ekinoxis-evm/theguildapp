import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/format";
import { navigationUrl } from "@/lib/maps";

export const metadata = { title: "Barbershop — The Guild" };

export default async function ShopPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/shops/${id}`);

  const [{ data: shop }, { data: staff }] = await Promise.all([
    supabase
      .from("barbershops")
      .select(
        "id, name, phone, description, status, services_fulfilled_count, barbershop_locations(id, formatted_address, city, state, zip_code, google_place_id), services(id, name, price_cents, currency, duration_minutes, active)"
      )
      .eq("id", id)
      .eq("status", "approved")
      .maybeSingle(),
    supabase.rpc("shop_staff_directory", { p_shop_id: id }),
  ]);

  if (!shop) notFound();

  const services = shop.services.filter((s) => s.active);
  const barbers = staff ?? [];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/shops" className="underline">
          ← All barbershops
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{shop.name}</h1>
      <p className="mt-1 text-sm text-guild-yellow">
        {shop.services_fulfilled_count} services fulfilled
      </p>
      {shop.description && (
        <p className="mt-3 text-sm text-neutral-400">{shop.description}</p>
      )}
      {shop.phone && (
        <p className="mt-1 text-sm text-neutral-400">{shop.phone}</p>
      )}

      <h2 className="mt-8 text-lg font-medium">Locations</h2>
      <ul className="mt-3 space-y-2 text-sm">
        {shop.barbershop_locations.map((l) => (
          <li
            key={l.id}
            className="flex items-center justify-between gap-3 border border-neutral-800 p-3"
          >
            <span>
              {l.formatted_address}
              <span className="block text-neutral-500">
                {l.city}, {l.state} {l.zip_code}
              </span>
            </span>
            <a
              href={navigationUrl(l)}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-xs underline"
            >
              Navigate
            </a>
          </li>
        ))}
        {shop.barbershop_locations.length === 0 && (
          <li className="text-neutral-500">No locations listed.</li>
        )}
      </ul>

      {barbers.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-medium">Barbers</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {barbers.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-3 border border-neutral-800 p-3"
              >
                <span>
                  {b.full_name}
                  <span className="block text-neutral-500">
                    {b.guild_headline ??
                      (b.skills.length > 0 ? b.skills.join(", ") : "Barber")}
                  </span>
                </span>
                {b.guild_profile_id && (
                  <Link
                    href={`/barbers/${b.guild_profile_id}`}
                    className="shrink-0 text-xs underline"
                  >
                    Guild profile
                  </Link>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-neutral-500">
            Pick your barber when booking any service below.
          </p>
        </>
      )}

      <h2 className="mt-8 text-lg font-medium">Services</h2>
      <ul className="mt-3 space-y-2">
        {services.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-3 border border-neutral-800 p-3 text-sm"
          >
            <span>
              {s.name}
              <span className="block text-neutral-500">
                {formatPrice(s.price_cents, s.currency)} · {s.duration_minutes} min
              </span>
            </span>
            <Link
              href={`/shops/${shop.id}/book?service=${s.id}`}
              className="shrink-0 bg-guild-yellow px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-guild-black"
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
