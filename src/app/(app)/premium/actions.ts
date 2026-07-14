"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { appUrl, getOrCreateStripeCustomer, stripeClient } from "@/lib/stripe";

// $19.99/mo subscription checkout. Tier flips to premium only when the
// webhook confirms the subscription — never from the client.
export async function startPremiumCheckout(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single();
  if (profile?.tier === "premium") redirect("/premium");

  const customerId = await getOrCreateStripeCustomer(user.id, user.email);
  const session = await stripeClient().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: process.env.STRIPE_PREMIUM_PRICE_ID!, quantity: 1 }],
    metadata: { kind: "premium", supabase_user_id: user.id },
    subscription_data: { metadata: { supabase_user_id: user.id } },
    success_url: `${appUrl()}/premium?upgraded=1`,
    cancel_url: `${appUrl()}/premium`,
  });
  if (!session.url) redirect("/premium?error=checkout");
  redirect(session.url);
}

// Stripe Customer Portal: self-service payment method updates, invoices,
// cancellation. Creates a portal configuration on first use if the account
// has none (fresh test accounts don't).
export async function openBillingPortal(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_customer_id) redirect("/premium");

  const stripe = stripeClient();
  let portalUrl: string;
  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl()}/premium`,
    });
    portalUrl = portal.url;
  } catch {
    const config = await stripe.billingPortal.configurations.create({
      features: {
        invoice_history: { enabled: true },
        payment_method_update: { enabled: true },
        subscription_cancel: { enabled: true, mode: "at_period_end" },
      },
    });
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      configuration: config.id,
      return_url: `${appUrl()}/premium`,
    });
    portalUrl = portal.url;
  }
  redirect(portalUrl);
}
