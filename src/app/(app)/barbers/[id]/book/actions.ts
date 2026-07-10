"use server";

import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";
import { bookingIcs } from "@/lib/ics";
import { formatDateTime } from "@/lib/format";

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
}): Promise<{ ok: true } | { ok: false; error: string }> {
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
    .select("id, name, duration_minutes, private_barber_id, active")
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

  if (user.email) {
    const location = `${address.street_address}${address.unit ? ` ${address.unit}` : ""}, ${address.city}, ${address.state} ${address.zip_code}`;
    await sendEmail({
      to: user.email,
      subject: "At-home booking requested — The Guild",
      text: [
        `Your at-home booking request was sent.`,
        ``,
        `Service: ${service.name}`,
        `When: ${formatDateTime(scheduledAt.toISOString())}`,
        `Where: ${location}`,
        ``,
        `The barber will confirm shortly. Track it at /bookings.`,
      ].join("\n"),
      icsContent: bookingIcs({
        id: booking.id,
        scheduledAt: scheduledAt.toISOString(),
        durationMinutes: service.duration_minutes,
        summary: `${service.name} — The Guild at home`,
        location,
      }),
    });
  }

  return { ok: true };
}
