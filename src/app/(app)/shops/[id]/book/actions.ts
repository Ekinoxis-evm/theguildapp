"use server";

import { createClient } from "@/lib/supabase/server";
import { createBookingCheckout } from "@/lib/booking-checkout";

export async function createBooking(input: {
  shopId: string;
  serviceId: string;
  locationId: string | null;
  scheduledAt: string;
}): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
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
    .select(
      "id, name, price_cents, currency, duration_minutes, barbershop_id, active, barbershops(name)"
    )
    .eq("id", input.serviceId)
    .eq("barbershop_id", input.shopId)
    .single();
  if (!service?.active) return { ok: false, error: "Service unavailable." };

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    return { ok: false, error: "Pick a future date and time." };
  }

  // Inserted under the caller's session — RLS enforces client_id, approved
  // shop, active service, pending status. Payment columns are stamped by the
  // Stripe webhook only.
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
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const shopName = service.barbershops?.name ?? "your barbershop";
  const checkout = await createBookingCheckout({
    bookingId: booking.id,
    userId: user.id,
    email: user.email,
    label: `${service.name} — ${shopName}`,
    priceCents: service.price_cents,
    currency: service.currency,
  });
  if (!checkout.ok) return checkout;
  return { ok: true, checkoutUrl: checkout.checkoutUrl };
}
