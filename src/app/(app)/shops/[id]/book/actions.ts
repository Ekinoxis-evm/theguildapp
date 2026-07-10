"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { bookingIcs } from "@/lib/ics";
import { formatDateTime } from "@/lib/format";

export async function createBooking(input: {
  shopId: string;
  serviceId: string;
  locationId: string | null;
  scheduledAt: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  // Style gate server-side: all four current photos must exist.
  const { count } = await supabase
    .from("style_photos")
    .select("position", { count: "exact", head: true })
    .eq("profile_id", user.id);
  if ((count ?? 0) < 4) {
    return { ok: false, error: "Add your four style photos before booking." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes, barbershop_id, active, barbershops(name)")
    .eq("id", input.serviceId)
    .eq("barbershop_id", input.shopId)
    .single();
  if (!service?.active) return { ok: false, error: "Service unavailable." };

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    return { ok: false, error: "Pick a future date and time." };
  }

  // Inserted under the caller's session — RLS enforces client_id, approved
  // shop, active service, pending status.
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      client_id: user.id,
      barbershop_id: input.shopId,
      location_id: input.locationId,
      service_id: input.serviceId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: service.duration_minutes,
      style_confirmed_at: new Date().toISOString(),
    })
    .select("id, barbershop_locations(formatted_address, city, state)")
    .single();
  if (error) return { ok: false, error: error.message };

  // Best-effort confirmation email (no-op until RESEND_API_KEY is set).
  const shopName = service.barbershops?.name ?? "your barbershop";
  const location = booking.barbershop_locations
    ? `${booking.barbershop_locations.formatted_address}, ${booking.barbershop_locations.city}, ${booking.barbershop_locations.state}`
    : undefined;
  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: `Booking requested — ${shopName}`,
      text: [
        `Your booking request was sent to ${shopName}.`,
        ``,
        `Service: ${service.name}`,
        `When: ${formatDateTime(scheduledAt.toISOString())}`,
        ...(location ? [`Where: ${location}`] : []),
        ``,
        `The shop will confirm shortly. Track it at /bookings.`,
      ].join("\n"),
      icsContent: bookingIcs({
        id: booking.id,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: service.duration_minutes,
        summary: `${service.name} — ${shopName}`,
        location,
      }),
    });
  }

  return { ok: true };
}
