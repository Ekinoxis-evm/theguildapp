import { appUrl, getOrCreateStripeCustomer, stripeClient } from "@/lib/stripe";

// NOT a server action — deliberately lives outside any "use server" module
// so the price argument can never be supplied by a client. Callers re-read
// price_cents/currency from the DB before calling.
export async function createBookingCheckout(args: {
  bookingId: string;
  userId: string;
  email: string | undefined;
  label: string;
  priceCents: number;
  currency: string;
}): Promise<{ ok: true; checkoutUrl: string } | { ok: false; error: string }> {
  try {
    const customerId = await getOrCreateStripeCustomer(args.userId, args.email);
    const session = await stripeClient().checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: args.currency.toLowerCase(),
            unit_amount: args.priceCents,
            product_data: { name: args.label },
          },
        },
      ],
      metadata: {
        kind: "booking",
        booking_id: args.bookingId,
        supabase_user_id: args.userId,
      },
      payment_intent_data: { metadata: { booking_id: args.bookingId } },
      // Unpaid sessions expire after 30 min; the webhook cancels the booking.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${appUrl()}/bookings?paid=1`,
      cancel_url: `${appUrl()}/bookings?payment=pending`,
    });
    if (!session.url) return { ok: false, error: "Could not start checkout." };
    return { ok: true, checkoutUrl: session.url };
  } catch (err) {
    console.error("stripe checkout create failed:", err);
    return {
      ok: false,
      error: "Payment could not be started. Retry from your Bookings page.",
    };
  }
}
