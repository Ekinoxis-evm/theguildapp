import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";

// Best-effort waitlist notifier, fired after a cancellation frees a slot.
// Any signed-in user may trigger a check; the server independently verifies
// real availability before emailing, so the caller can't spam or mislead.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  let body: { bookingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!body.bookingId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // The caller must be able to see the booking (RLS: its client, or the
  // shop side) and it must genuinely be cancelled — the freed slot is the
  // only event that justifies notifying the waitlist.
  const { data: booking } = await supabase
    .from("bookings")
    .select("location_id, scheduled_at, status")
    .eq("id", body.bookingId)
    .maybeSingle();
  if (!booking || booking.status !== "cancelled" || !booking.location_id) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const locationId = booking.location_id;
  const day = booking.scheduled_at.slice(0, 10);

  const admin = createAdminClient();
  const { data: entries } = await admin
    .from("booking_waitlist")
    .select("id, client_id, service_id, staff_id")
    .eq("location_id", locationId)
    .eq("day", day)
    .is("notified_at", null)
    .limit(20);
  if (!entries?.length) return NextResponse.json({ ok: true, notified: 0 });

  const { data: loc } = await admin
    .from("barbershop_locations")
    .select("barbershop_id, barbershops(name)")
    .eq("id", locationId)
    .single();
  const shopName =
    (loc as { barbershops?: { name?: string } | null } | null)?.barbershops?.name ?? "the shop";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://theguildapp.vercel.app";

  let notified = 0;
  const slotCache = new Map<string, boolean>();
  for (const entry of entries) {
    const cacheKey = `${entry.service_id}:${entry.staff_id ?? "any"}`;
    let hasSlot = slotCache.get(cacheKey);
    if (hasSlot === undefined) {
      // User-context RPC: available_slots requires an authenticated caller.
      const { data: slots } = await supabase.rpc("available_slots", {
        p_location_id: locationId,
        p_service_id: entry.service_id,
        p_day: day,
        p_staff_id: entry.staff_id ?? undefined,
      });
      hasSlot = Boolean(slots?.length);
      slotCache.set(cacheKey, hasSlot);
    }
    if (!hasSlot) continue;

    const { data: authUser } = await admin.auth.admin.getUserById(entry.client_id);
    const email = authUser?.user?.email;
    if (email) {
      await sendEmail({
        to: email,
        subject: `A time opened at ${shopName} — The Guild`,
        text: [
          `Good news — a booking time just opened at ${shopName} on ${day}.`,
          "",
          `Book it before someone else does:`,
          `${appUrl}/shops/${loc?.barbershop_id}/book?service=${entry.service_id}`,
          "",
          "You're getting this because you joined the waitlist for that day.",
        ].join("\n"),
      });
      await admin
        .from("booking_waitlist")
        .update({ notified_at: new Date().toISOString() })
        .eq("id", entry.id);
      notified++;
    }
  }

  return NextResponse.json({ ok: true, notified });
}
