import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Server-side only. Checkout Sessions everywhere; payment method types are
// never passed so Stripe picks them dynamically (dashboard-configurable).

export function stripeClient(): Stripe {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

// Returns the user's Stripe customer id, creating and linking one on first
// use. The link is written with the service-role client — profiles Stripe
// columns are guarded against writes from user sessions.
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined
): Promise<string> {
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();
  if (profile?.stripe_customer_id) return profile.stripe_customer_id;

  const customer = await stripeClient().customers.create({
    email,
    metadata: { supabase_user_id: userId },
  });

  // Only claim the slot if still empty; a concurrent request may have won.
  const { data: claimed } = await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId)
    .is("stripe_customer_id", null)
    .select("stripe_customer_id")
    .maybeSingle();
  if (claimed?.stripe_customer_id) return claimed.stripe_customer_id;

  const { data: existing } = await admin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", userId)
    .single();
  return existing?.stripe_customer_id ?? customer.id;
}
