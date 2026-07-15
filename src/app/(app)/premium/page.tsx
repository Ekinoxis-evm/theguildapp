import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n";
import { dict } from "@/lib/dictionaries";
import { openBillingPortal, startPremiumCheckout } from "./actions";

export const metadata = { title: "Premium — The Guild" };

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

  const [{ data: profile }, params, lang] = await Promise.all([
    supabase
      .from("profiles")
      .select("tier, subscription_status, stripe_subscription_id")
      .eq("id", user.id)
      .single(),
    searchParams,
    getLang(),
  ]);
  const t = dict(lang).premium;

  const isPremium = profile?.tier === "premium";
  const hasSubscription = Boolean(profile?.stripe_subscription_id);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          {t.backToDashboard}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        {t.title} <span className="text-yellow-600">{t.titleAccent}</span>
      </h1>
      <p className="mt-1 text-sm text-neutral-500">{t.tagline}</p>

      {params.upgraded === "1" && !isPremium && (
        <p className="mt-4 rounded border border-emerald-600/40 bg-emerald-50 p-3 text-sm">
          {t.paymentReceived}
        </p>
      )}
      {params.error === "checkout" && (
        <p className="mt-4 rounded border border-red-600/40 bg-red-50 p-3 text-sm">
          {t.checkoutError}
        </p>
      )}

      <ul className="mt-6 space-y-2 text-sm">
        {t.perks.map((perk) => (
          <li key={perk} className="flex gap-2">
            <span className="text-yellow-600">◆</span>
            <span>{perk}</span>
          </li>
        ))}
      </ul>

      {isPremium ? (
        <div className="mt-8 rounded border border-neutral-300 p-4 text-sm">
          <p className="font-medium">{t.youArePremium}</p>
          {hasSubscription ? (
            <>
              <p className="mt-1 text-neutral-600">
                {t.subscriptionStatus}{" "}
                <span className="uppercase tracking-wide">
                  {profile?.subscription_status ?? "active"}
                </span>
              </p>
              <form action={openBillingPortal} className="mt-4">
                <button
                  type="submit"
                  className="rounded border border-neutral-900 px-4 py-2 text-sm font-medium"
                >
                  {t.manage}
                </button>
              </form>
              <p className="mt-2 text-xs text-neutral-500">{t.manageBlurb}</p>
            </>
          ) : (
            <p className="mt-1 text-neutral-600">{t.grantedByTeam}</p>
          )}
          <p className="mt-4 text-sm">
            <Link href="/barbers" className="underline">
              {t.browseBarbers}
            </Link>
          </p>
        </div>
      ) : (
        <div className="mt-8 rounded border border-neutral-300 p-4">
          <p className="text-2xl font-semibold">
            $19.99
            <span className="text-sm font-normal text-neutral-500">
              {t.perMonth}
            </span>
          </p>
          <form action={startPremiumCheckout} className="mt-4">
            <button
              type="submit"
              className="w-full rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              {t.upgrade}
            </button>
          </form>
          <p className="mt-2 text-xs text-neutral-500">{t.secureCheckout}</p>
        </div>
      )}
    </main>
  );
}
