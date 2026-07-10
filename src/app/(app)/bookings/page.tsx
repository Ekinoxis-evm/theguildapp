import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { googleCalendarUrl } from "@/lib/ics";
import { ClientBookings } from "./client-bookings";

export const metadata = { title: "Bookings — The Guild" };

export default async function BookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookings");

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      "*, services(name), barbershops(name), barbershop_locations(formatted_address, city, state)"
    )
    .eq("client_id", user.id)
    .order("scheduled_at", { ascending: false });

  const withCalendar = (bookings ?? []).map((b) => ({
    ...b,
    googleCalendarUrl: googleCalendarUrl({
      scheduledAt: b.scheduled_at,
      durationMinutes: b.duration_minutes,
      summary: `${b.services?.name ?? "Service"} — ${b.barbershops?.name ?? "The Guild"}`,
      location: b.barbershop_locations
        ? `${b.barbershop_locations.formatted_address}, ${b.barbershop_locations.city}, ${b.barbershop_locations.state}`
        : undefined,
    }),
  }));

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Bookings</h1>
      <ClientBookings bookings={withCalendar} />
      <p className="mt-8 text-sm">
        <Link href="/shops" className="underline">
          Book a new appointment →
        </Link>
      </p>
    </main>
  );
}
