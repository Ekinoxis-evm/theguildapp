import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bookingIcs } from "@/lib/ics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // RLS scopes this to the caller's own bookings (or their shop's).
  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, scheduled_at, duration_minutes, services(name), barbershops(name), barbershop_locations(formatted_address, city, state)"
    )
    .eq("id", id)
    .maybeSingle();
  if (!booking) return NextResponse.json({ error: "not found" }, { status: 404 });

  const ics = bookingIcs({
    id: booking.id,
    scheduledAt: booking.scheduled_at,
    durationMinutes: booking.duration_minutes,
    summary: `${booking.services?.name ?? "Service"} — ${booking.barbershops?.name ?? "The Guild"}`,
    location: booking.barbershop_locations
      ? `${booking.barbershop_locations.formatted_address}, ${booking.barbershop_locations.city}, ${booking.barbershop_locations.state}`
      : undefined,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="guild-booking.ics"`,
    },
  });
}
