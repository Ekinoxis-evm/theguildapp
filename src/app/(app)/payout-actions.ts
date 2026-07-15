"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createOnboardingLink, getOrCreateConnectAccount } from "@/lib/connect";

// Eligibility is verified server-side per path before any Stripe call:
// only real barbers / shop owners can open a Connect onboarding flow.

export async function startBarberPayoutOnboarding(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-barber");

  const { data: barber } = await supabase
    .from("private_barbers")
    .select("profile_id")
    .eq("profile_id", user.id)
    .maybeSingle();
  if (!barber) redirect("/my-barber");

  let url: string;
  try {
    const accountId = await getOrCreateConnectAccount(user.id, user.email);
    url = await createOnboardingLink(accountId, "/my-barber");
  } catch (err) {
    // Connect platform not enabled on the Stripe account yet (founder step).
    console.error("payout onboarding unavailable:", err);
    redirect("/my-barber?payouts=unavailable");
  }
  redirect(url);
}

export async function startShopPayoutOnboarding(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-shop");

  const { data: shop } = await supabase
    .from("barbershops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!shop) redirect("/my-shop");

  let url: string;
  try {
    const accountId = await getOrCreateConnectAccount(user.id, user.email);
    url = await createOnboardingLink(accountId, "/my-shop");
  } catch (err) {
    console.error("payout onboarding unavailable:", err);
    redirect("/my-shop?payouts=unavailable");
  }
  redirect(url);
}
