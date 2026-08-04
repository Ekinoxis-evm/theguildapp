import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopsMap, type ShopPin } from "@/components/maps/shops-map";
import { RatingBadge } from "@/components/rating";

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

  const { data: allReviews } = await supabase
    .from("reviews")
    .select("barbershop_id, rating")
    .not("barbershop_id", "is", null);
  const reviewsByShop = new Map<string, { rating: number }[]>();
  for (const r of allReviews ?? []) {
    if (!r.barbershop_id) continue;
    const list = reviewsByShop.get(r.barbershop_id) ?? [];
    list.push({ rating: r.rating });
    reviewsByShop.set(r.barbershop_id, list);
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
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
                className="block border border-neutral-800 p-4 hover:border-guild-yellow"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-medium">{shop.name}</p>
                  <p className="shrink-0 text-xs text-guild-yellow">
                    {shop.services_fulfilled_count} services fulfilled{" "}
                    <RatingBadge reviews={reviewsByShop.get(shop.id) ?? []} />
                  </p>
                </div>
                {cities && <p className="mt-1 text-sm text-neutral-400">{cities}</p>}
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
