import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopsMap, type ShopPin } from "@/components/maps/shops-map";

export const metadata = { title: "Barbershops — The Guild" };

export default async function ShopsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/shops");

  const { data: shops } = await supabase
    .from("barbershops")
    .select(
      "id, name, description, services_fulfilled_count, barbershop_locations(city, state, lat, lng)"
    )
    .eq("status", "approved")
    .order("services_fulfilled_count", { ascending: false });

  const pins: ShopPin[] = (shops ?? []).flatMap((shop) =>
    shop.barbershop_locations
      .filter((l) => l.lat !== null && l.lng !== null)
      .map((l) => ({ shopId: shop.id, name: shop.name, lat: l.lat!, lng: l.lng! }))
  );

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Barbershops</h1>

      <ShopsMap pins={pins} />

      <ul className="mt-8 space-y-3">
        {(shops ?? []).map((shop) => {
          const cities = [
            ...new Set(
              shop.barbershop_locations.map((l) => `${l.city}, ${l.state}`)
            ),
          ].join(" · ");
          return (
            <li key={shop.id}>
              <Link
                href={`/shops/${shop.id}`}
                className="block rounded border border-neutral-300 p-4 hover:border-neutral-900"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{shop.name}</p>
                  <p className="shrink-0 text-xs text-yellow-600">
                    {shop.services_fulfilled_count} services fulfilled
                  </p>
                </div>
                {cities && <p className="mt-1 text-sm text-neutral-600">{cities}</p>}
                {shop.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
                    {shop.description}
                  </p>
                )}
              </Link>
            </li>
          );
        })}
        {(shops ?? []).length === 0 && (
          <li className="text-sm text-neutral-500">
            No barbershops live yet — check back soon.
          </li>
        )}
      </ul>
    </main>
  );
}
