"use server";

import { createClient } from "@/lib/supabase/server";
import { createBookingCheckout } from "@/lib/booking-checkout";

export type AddressInput = {
  street_address: string;
  unit: string;
  city: string;
  state: string;
  zip_code: string;
};

export async function createAtHomeBooking(input: {
  barberId: string;
  serviceId: string;
  scheduledAt: string;
  address: AddressInput;
  saveAddress: boolean;
}): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  if (profile?.tier !== "premium") {
    return { ok: false, error: "At-home service is premium-only." };
  }

  const { count } = await supabase
    .from("style_photos")
    .select("position", { count: "exact", head: true })
    .eq("profile_id", user.id);
  if ((count ?? 0) < 4) {
    return { ok: false, error: "Add your four style photos before booking." };
  }

  const { data: service } = await supabase
    .from("services")
    .select("id, name, price_cents, currency, duration_minutes, private_barber_id, active")
    .eq("id", input.serviceId)
    .eq("private_barber_id", input.barberId)
    .single();
  if (!service?.active) return { ok: false, error: "Service unavailable." };

  const scheduledAt = new Date(input.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime()) || scheduledAt <= new Date()) {
    return { ok: false, error: "Pick a future date and time." };
  }

  const address = {
    street_address: input.address.street_address.trim(),
    unit: input.address.unit.trim() || null,
    city: input.address.city.trim(),
    state: input.address.state.trim(),
    zip_code: input.address.zip_code.trim(),
  };
  if (!address.street_address || !address.city || !address.state || !address.zip_code) {
    return { ok: false, error: "Complete the service address." };
  }

  if (input.saveAddress) {
    await supabase.from("client_addresses").insert({ profile_id: user.id, ...address });
  }

  // The barber gets the frozen snapshot on the booking row — never table
  // access to client_addresses (docs/SECURITY.md).
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      client_id: user.id,
      private_barber_id: input.barberId,
      service_id: input.serviceId,
      scheduled_at: scheduledAt.toISOString(),
      duration_minutes: service.duration_minutes,
      style_confirmed_at: new Date().toISOString(),
      address_snapshot: address,
    })
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  const checkout = await createBookingCheckout({
    bookingId: booking.id,
    userId: user.id,
    email: user.email,
    label: `${service.name} — The Guild at home`,
    priceCents: service.price_cents,
    currency: service.currency,
  });
  if (!checkout.ok) return checkout;
  return { ok: true, checkoutUrl: checkout.checkoutUrl };
}
