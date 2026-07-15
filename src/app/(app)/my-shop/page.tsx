import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RegisterShopForm } from "./register-form";
import { LocationsManager } from "./locations";
import { ServicesManager } from "./services";
import { StaffManager } from "./staff";
import { ShopBookings } from "./shop-bookings";
import { EnrollmentsManager } from "./enrollments";
import { PayoutsSection } from "../payouts-section";
import { startShopPayoutOnboarding } from "../payout-actions";
import { refreshPayoutReadiness } from "@/lib/connect";

export const metadata = { title: "My shop — The Guild" };

export default async function MyShopPage({
  searchParams,
}: {
  searchParams: Promise<{ payouts?: string }>;
}) {
  const { payouts } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-shop");

  const { data: shop } = await supabase
    .from("barbershops")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  // Staff without an owned shop see their shop's bookings only.
  if (!shop) {
    const { data: staffRow } = await supabase
      .from("barbershop_staff")
      .select("barbershop_id, full_name")
      .eq("profile_id", user.id)
      .limit(1)
      .maybeSingle();

    if (staffRow) {
      const { data: staffShop } = await supabase
        .from("barbershops")
        .select("id, name, status")
        .eq("id", staffRow.barbershop_id)
        .single();
      const { data: bookings } = await supabase
        .from("bookings")
        .select(
          "*, services(name, duration_minutes), profiles!bookings_client_id_fkey(first_name, last_name), barbershop_staff(full_name)"
        )
        .eq("barbershop_id", staffRow.barbershop_id)
        .order("scheduled_at", { ascending: true });

      return (
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
          <BackLink />
          <h1 className="mt-2 text-2xl font-semibold">{staffShop?.name}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            You&apos;re on the team. Manage the shop&apos;s bookings below.
          </p>
          <ShopBookings bookings={bookings ?? []} />
        </main>
      );
    }

    return (
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
        <BackLink />
        <h1 className="mt-2 text-2xl font-semibold">List your barbershop</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tell us about your shop. The Guild team reviews every application
          before it goes live to clients.
        </p>
        <RegisterShopForm ownerId={user.id} />
      </main>
    );
  }

  const [
    { data: locations },
    { data: services },
    { data: staff },
    { data: bookings },
    { data: enrollments },
  ] = await Promise.all([
    supabase
      .from("barbershop_locations")
      .select("*")
      .eq("barbershop_id", shop.id)
      .order("created_at"),
    supabase
      .from("services")
      .select("*")
      .eq("barbershop_id", shop.id)
      .order("created_at"),
    supabase
      .from("barbershop_staff")
      .select("*")
      .eq("barbershop_id", shop.id)
      .order("created_at"),
    supabase
      .from("bookings")
      .select(
        "*, services(name, duration_minutes), profiles!bookings_client_id_fkey(first_name, last_name), barbershop_staff(full_name)"
      )
      .eq("barbershop_id", shop.id)
      .order("scheduled_at", { ascending: true }),
    supabase
      .from("barber_affiliations")
      .select(
        "id, role_title, started_on, ended_on, confirmed_at, private_barbers!barber_affiliations_barber_id_fkey(profiles!private_barbers_profile_id_fkey(first_name, last_name))"
      )
      .eq("barbershop_id", shop.id)
      .is("ended_on", null)
      .order("started_on", { ascending: false }),
  ]);

  const { data: connectRow } = await supabase
    .from("connect_accounts")
    .select("payouts_ready_at")
    .eq("profile_id", user.id)
    .maybeSingle();
  const payoutsReady = connectRow?.payouts_ready_at
    ? true
    : connectRow
      ? await refreshPayoutReadiness(user.id)
      : false;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <BackLink />
      <h1 className="mt-2 text-2xl font-semibold">{shop.name}</h1>
      {shop.status === "pending" && (
        <p className="mt-3 rounded border border-yellow-600/40 bg-yellow-50 p-3 text-sm">
          Application under review — your shop isn&apos;t visible to clients
          yet. You can set up locations, services, and staff meanwhile.
        </p>
      )}
      {shop.status === "suspended" && (
        <p className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm">
          This shop is suspended. Contact The Guild team.
        </p>
      )}
      {shop.status === "approved" && (
        <p className="mt-1 text-sm text-neutral-600">
          Live · {shop.services_fulfilled_count} services fulfilled
        </p>
      )}

      <div className="mt-10 space-y-12">
        <ShopBookings bookings={bookings ?? []} />
        <PayoutsSection
          ready={payoutsReady}
          hasAccount={Boolean(connectRow)}
          action={startShopPayoutOnboarding}
          unavailable={payouts === "unavailable"}
        />
        <LocationsManager shopId={shop.id} initial={locations ?? []} />
        <ServicesManager shopId={shop.id} initial={services ?? []} />
        <StaffManager shopId={shop.id} initial={staff ?? []} />
        <EnrollmentsManager initial={enrollments ?? []} />
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
