import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Private barbers — The Guild" };

export default async function BarbersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/barbers");

  const [{ data: profile }, { data: barbers }] = await Promise.all([
    supabase.from("profiles").select("tier").eq("id", user.id).single(),
    supabase
      .from("private_barbers")
      .select(
        "profile_id, bio, self_photo_path, base_price_cents, services_fulfilled_count, coverage_areas(city, state), profiles!private_barbers_profile_id_fkey(first_name, last_name)"
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
      <h1 className="mt-2 text-2xl font-semibold">Private barbers</h1>
      <p className="mt-1 text-sm text-neutral-500">
        At-home grooming, wherever you are.
      </p>

      {!isPremium && (
        <p className="mt-4 rounded border border-yellow-600/40 bg-yellow-50 p-3 text-sm">
          At-home service is a <strong>premium</strong> feature.{" "}
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
          return (
            <li key={b.profile_id} className="rounded border border-neutral-300 p-4">
              <div className="flex items-start gap-4">
                {b.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL
                  <img
                    src={b.photoUrl}
                    alt={name}
                    className="h-16 w-16 shrink-0 rounded-full border border-neutral-300 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 shrink-0 rounded-full border border-neutral-300 bg-neutral-100" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium">{name}</p>
                    <p className="shrink-0 text-xs text-yellow-600">
                      {b.services_fulfilled_count} services
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    From {formatPrice(b.base_price_cents)}
                    {cities ? ` · ${cities}` : ""}
                  </p>
                  {b.bio && (
                    <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{b.bio}</p>
                  )}
                  {isPremium && (
                    <Link
                      href={`/barbers/${b.profile_id}`}
                      className="mt-2 inline-block rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      View & book
                    </Link>
                  )}
                </div>
              </div>
            </li>
          );
        })}
        {enriched.length === 0 && (
          <li className="text-sm text-neutral-500">No private barbers live yet.</li>
        )}
      </ul>
    </main>
  );
}
