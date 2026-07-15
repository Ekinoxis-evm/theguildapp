import { appUrl, stripeClient } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Stripe Connect (Accounts v2, marketplace pattern): recipient accounts with
// an Express dashboard; platform collects fees and owns losses. Bookings pay
// out via destination charges minus the platform fee. Server-side only.

export const PLATFORM_FEE_PERCENT = 15;

export function platformFeeCents(amountCents: number): number {
  return Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);
}

// One connected account per user — covers their barber profile and/or shop.
export async function getOrCreateConnectAccount(
  profileId: string,
  email: string | undefined
): Promise<string> {
  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("connect_accounts")
    .select("stripe_account_id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (existing) return existing.stripe_account_id;

  // Controller-based classic API — Accounts v2 is not yet enabled on this
  // Stripe account (verified 2026-07-15). Same marketplace semantics:
  // Express dashboard, platform collects fees and owns losses. Migrate to
  // stripe.v2.core.accounts once Stripe enables Accounts v2.
  const stripe = stripeClient();
  const account = await stripe.accounts.create({
    controller: {
      fees: { payer: "application" },
      losses: { payments: "application" },
      stripe_dashboard: { type: "express" },
    },
    country: "US",
    email,
    capabilities: { transfers: { requested: true } },
    metadata: { supabase_user_id: profileId },
  });

  const { error } = await admin.from("connect_accounts").insert({
    profile_id: profileId,
    stripe_account_id: account.id,
  });
  if (error) {
    // Concurrent creation — reuse whichever row won.
    const { data: winner } = await admin
      .from("connect_accounts")
      .select("stripe_account_id")
      .eq("profile_id", profileId)
      .single();
    return winner?.stripe_account_id ?? account.id;
  }
  return account.id;
}

export async function createOnboardingLink(
  accountId: string,
  returnPath: string
): Promise<string> {
  const link = await stripeClient().accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${appUrl()}${returnPath}?payouts=refresh`,
    return_url: `${appUrl()}${returnPath}?payouts=done`,
  });
  return link.url;
}

// Re-checks the v2 recipient capability and stamps payouts_ready_at once
// active. Called from console pages after onboarding, never during checkout.
export async function refreshPayoutReadiness(profileId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("connect_accounts")
    .select("stripe_account_id, payouts_ready_at")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (!row) return false;
  if (row.payouts_ready_at) return true;

  try {
    const account = await stripeClient().accounts.retrieve(row.stripe_account_id);
    if (account.capabilities?.transfers === "active") {
      await admin
        .from("connect_accounts")
        .update({ payouts_ready_at: new Date().toISOString() })
        .eq("profile_id", profileId);
      return true;
    }
  } catch (err) {
    console.error("connect readiness check failed:", err);
  }
  return false;
}

// Destination for a booking's payee — only accounts already verified ready,
// so checkout never waits on a Stripe status call. Unready payees fall back
// to a platform charge (funds settled manually until they finish onboarding).
export async function getReadyDestination(
  payeeProfileId: string
): Promise<string | null> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("connect_accounts")
    .select("stripe_account_id, payouts_ready_at")
    .eq("profile_id", payeeProfileId)
    .maybeSingle();
  return row?.payouts_ready_at ? row.stripe_account_id : null;
}
