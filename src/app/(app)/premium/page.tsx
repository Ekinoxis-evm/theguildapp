import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { openBillingPortal, startPremiumCheckout } from "./actions";

export const metadata = { title: "Premium — The Guild" };

const PERKS = [
  "At-home service: book approved private barbers to come to you",
  "Your exact address is stored securely and shared only with your booked barber",
  "Cancel anytime — premium stays active until the end of the billing period",
];

export default async function PremiumPage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string; error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/premium");

  const [{ data: profile }, params] = await Promise.all([
    supabase
      .from("profiles")
      .select("tier, subscription_status, stripe_subscription_id")
      .eq("id", user.id)
      .single(),
    searchParams,
  ]);

  const isPremium = profile?.tier === "premium";
  const hasSubscription = Boolean(profile?.stripe_subscription_id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        Guild <span className="text-yellow-600">Premium</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        The barbershop comes to you.
      </p>

      {params.upgraded === "1" && !isPremium && (
        <p className="mt-4 rounded border border-emerald-600/40 bg-emerald-50 p-3 text-sm">
          Payment received — your premium access activates in a few seconds.
          Refresh this page.
        </p>
      )}
      {params.error === "checkout" && (
        <p className="mt-4 rounded border border-red-600/40 bg-red-50 p-3 text-sm">
          Checkout could not be started. Please try again.
        </p>
      )}

      <ul className="mt-6 space-y-2 text-sm">
        {PERKS.map((perk) => (
          <li key={perk} className="flex gap-2">
            <span className="text-yellow-600">◆</span>
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      {isPremium ? (
        <div className="mt-8 rounded border border-neutral-300 p-4 text-sm">
          <p className="font-medium">You&apos;re premium.</p>
          {hasSubscription ? (
            <>
              <p className="mt-1 text-neutral-600">
                Subscription status:{" "}
                <span className="uppercase tracking-wide">
                  {profile?.subscription_status ?? "active"}
                </span>
              </p>
              <form action={openBillingPortal} className="mt-4">
                <button
                  type="submit"
                  className="rounded border border-neutral-900 px-4 py-2 text-sm font-medium"
                >
                  Manage subscription
                </button>
              </form>
              <p className="mt-2 text-xs text-neutral-500">
                Update your payment method, view invoices, or cancel — handled
                securely by Stripe.
              </p>
            </>
          ) : (
            <p className="mt-1 text-neutral-600">
              Your premium access was granted by The Guild team.
            </p>
          )}
          <p className="mt-4 text-sm">
            <Link href="/barbers" className="underline">
              Browse private barbers →
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded border border-neutral-300 p-4">
          <p className="text-2xl font-semibold">
            $19.99
            <span className="text-sm font-normal text-neutral-500">/month</span>
          </p>
          <form action={startPremiumCheckout} className="mt-4">
            <button
              type="submit"
              className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              Upgrade to Premium
            </button>
          </form>
          <p className="mt-2 text-xs text-neutral-500">
            Secure checkout via Stripe. Cancel anytime.
          </p>
        </div>
      )}
    </main>
  );
}
