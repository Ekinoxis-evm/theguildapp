import type Stripe from "stripe";
import { stripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email";
import { bookingIcs } from "@/lib/ics";
import { formatDateTime } from "@/lib/format";

// Stripe webhook — the only writer of payment/subscription columns.
// Uses the service-role client; DB triggers block these columns for
// everyone reaching the DB through an authenticated session.

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return new Response("invalid signature", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode === "payment" && session.metadata?.kind === "booking") {
        await handleBookingPaid(session);
      } else if (session.mode === "subscription") {
        await handlePremiumStarted(session);
      }
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object;
      if (session.metadata?.kind === "booking" && session.metadata.booking_id) {
        await cancelUnpaidBooking(session.metadata.booking_id);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object);
      break;
    }
  }

  return Response.json({ received: true });
}

async function handleBookingPaid(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.booking_id;
  if (!bookingId) return;
  const admin = createAdminClient();

  // .is("paid_at", null) makes redelivered events no-ops.
  const { data: booking } = await admin
    .from("bookings")
    .update({
      amount_cents: session.amount_total,
      currency: (session.currency ?? "usd").toUpperCase(),
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", bookingId)
    .is("paid_at", null)
    .select(
      "id, client_id, scheduled_at, duration_minutes, address_snapshot, services(name), barbershops(name), barbershop_locations(formatted_address, city, state)"
    )
    .maybeSingle();
  if (!booking) return; // already processed or unknown id

  const { data: userData } = await admin.auth.admin.getUserById(booking.client_id);
  const email = userData?.user?.email;
  if (!email) return;

  const serviceName = booking.services?.name ?? "Service";
  const atHome = Boolean(booking.address_snapshot);
  const snapshot = booking.address_snapshot as {
    street_address?: string;
    unit?: string | null;
    city?: string;
    state?: string;
    zip_code?: string;
  } | null;
  const location = atHome
    ? [
        [snapshot?.street_address, snapshot?.unit].filter(Boolean).join(" "),
        snapshot?.city,
        `${snapshot?.state ?? ""} ${snapshot?.zip_code ?? ""}`.trim(),
      ]
        .filter(Boolean)
        .join(", ")
    : booking.barbershop_locations
      ? `${booking.barbershop_locations.formatted_address}, ${booking.barbershop_locations.city}, ${booking.barbershop_locations.state}`
      : undefined;
  const providerName = atHome
    ? "The Guild at home"
    : (booking.barbershops?.name ?? "your barbershop");

  await sendEmail({
    to: email,
    subject: `Payment confirmed — ${serviceName}`,
    text: [
      `Your payment is confirmed and your booking request was sent to ${providerName}.`,
      ``,
      `Service: ${serviceName}`,
      `When: ${formatDateTime(booking.scheduled_at)}`,
      ...(location ? [`Where: ${location}`] : []),
      ``,
      `You'll get a confirmation shortly. Track it at /bookings.`,
    ].join("\n"),
    icsContent: bookingIcs({
      id: booking.id,
      scheduledAt: booking.scheduled_at,
      durationMinutes: booking.duration_minutes,
      summary: `${serviceName} — ${providerName}`,
      location,
    }),
  });
}

async function cancelUnpaidBooking(bookingId: string) {
  const admin = createAdminClient();
  await admin
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", bookingId)
    .eq("status", "pending")
    .is("paid_at", null);
}

async function handlePremiumStarted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;
  const subscriptionId =
    typeof session.subscription === "string" ? session.subscription : null;
  if (!userId || !subscriptionId) return;
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      tier: "premium",
      stripe_subscription_id: subscriptionId,
      subscription_status: "active",
    })
    .eq("id", userId);
}

// Keeps tier in lockstep with the subscription for its Stripe customer.
// Manually granted premium (no stripe_customer_id link) is never touched.
async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;
  const active = ["active", "trialing"].includes(subscription.status);
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({
      tier: active ? "premium" : "standard",
      stripe_subscription_id: active ? subscription.id : null,
      subscription_status: subscription.status,
    })
    .eq("stripe_customer_id", customerId);
}
