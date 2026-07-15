"use server";

import { createClient } from "@/lib/supabase/server";
import { createBookingCheckout } from "@/lib/booking-checkout";

// Retry payment for a booking whose checkout was abandoned. Ownership,
// state, and price all come from the DB — the client only names the booking.
export async function payBooking(
  bookingId: string
): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { data: booking } = await supabase
    .from("bookings")
    .select(
      "id, status, paid_at, private_barber_id, services(name, price_cents, currency), barbershops(name, owner_id)"
    )
    .eq("id", bookingId)
    .eq("client_id", user.id)
    .single();
  if (!booking) return { ok: false, error: "Booking not found." };
  if (booking.paid_at) return { ok: false, error: "This booking is already paid." };
  if (!["pending", "confirmed"].includes(booking.status)) {
    return { ok: false, error: "This booking can no longer be paid." };
  }
  if (!booking.services) return { ok: false, error: "Service unavailable." };

  const label = booking.private_barber_id
    ? `${booking.services.name} — The Guild at home`
    : `${booking.services.name} — ${booking.barbershops?.name ?? "The Guild"}`;

  return createBookingCheckout({
    bookingId: booking.id,
    userId: user.id,
    email: user.email,
    label,
    priceCents: booking.services.price_cents,
    currency: booking.services.currency,
    payeeProfileId: booking.private_barber_id ?? booking.barbershops?.owner_id ?? null,
  });
}
