import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { ApplyBarberForm } from "./apply-form";
import { BarberProfileEditor } from "./profile-editor";
import { CoverageManager } from "./coverage";
import { BarberServicesManager } from "./barber-services";
import { CertificationsManager } from "./certifications";
import { AffiliationsManager } from "./affiliations";
import { ShopBookings } from "../my-shop/shop-bookings";

export const metadata = { title: "My barber profile — The Guild" };

export default async function MyBarberPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-barber");

  const { data: barber } = await supabase
    .from("private_barbers")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!barber) {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <BackLink />
        <h1 className="mt-2 text-2xl font-semibold">Become a Guild barber</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Build your professional profile — certifications, experience, shop
          enrollment — and optionally serve premium clients at their homes.
          The Guild team reviews every application.
        </p>
        <ApplyBarberForm profileId={user.id} />
      </main>
    );
  }

  const [
    { data: coverage },
    { data: services },
    { data: bookings },
    { data: certifications },
    { data: affiliations },
    { data: approvedShops },
  ] = await Promise.all([
    supabase
      .from("coverage_areas")
      .select("*")
      .eq("private_barber_id", user.id)
      .order("created_at"),
    supabase
      .from("services")
      .select("*")
      .eq("private_barber_id", user.id)
      .order("created_at"),
    supabase
      .from("bookings")
      .select(
        "*, services(name, duration_minutes), profiles!bookings_client_id_fkey(first_name, last_name)"
      )
      .eq("private_barber_id", user.id)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("barber_certifications")
      .select("*")
      .eq("barber_id", user.id)
      .order("created_at"),
    supabase
      .from("barber_affiliations")
      .select("*, barbershops(name)")
      .eq("barber_id", user.id)
      .order("started_on", { ascending: false }),
    supabase
      .from("barbershops")
      .select("id, name")
      .eq("status", "approved")
      .order("name"),
  ]);

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
      <BackLink />
      <h1 className="mt-2 text-2xl font-semibold">Barber profile</h1>
      {barber.status === "pending" && (
        <p className="mt-3 rounded border border-yellow-600/40 bg-yellow-50 p-3 text-sm">
          Application under review — finish your profile (photos, prices,
          coverage) meanwhile.
        </p>
      )}
      {barber.status === "approved" && (
        <p className="mt-1 text-sm text-neutral-600">
          Live · {barber.services_fulfilled_count} services fulfilled
        </p>
      )}

      <div className="mt-10 space-y-12">
        <ShopBookings bookings={bookings ?? []} />
        <BarberProfileEditor barber={barber} selfUrl={selfUrl} setupUrl={setupUrl} />
        <CertificationsManager barberId={user.id} initial={certifications ?? []} />
        <AffiliationsManager
          barberId={user.id}
          shops={approvedShops ?? []}
          initial={affiliations ?? []}
        />
        <BarberServicesManager barberId={user.id} initial={services ?? []} />
        <CoverageManager barberId={user.id} initial={coverage ?? []} />
      </div>
    </main>
  );
}

function BackLink() {
  return (
    <p className="text-sm">
      <Link href="/dashboard" className="underline">
        ← Dashboard
      </Link>
    </p>
  );
}
