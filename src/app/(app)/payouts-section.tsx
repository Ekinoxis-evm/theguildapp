// Server component — shared "Payouts" card for the barber and shop consoles.
import { PLATFORM_FEE_PERCENT } from "@/lib/connect";

export function PayoutsSection({
  ready,
  hasAccount,
  action,
  unavailable = false,
}: {
  ready: boolean;
  hasAccount: boolean;
  action: () => Promise<void>;
  unavailable?: boolean;
}) {
  return (
    <section>
      <h2 className="text-lg font-medium">Payouts</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Clients pay online when they book. The Guild keeps a{" "}
        {PLATFORM_FEE_PERCENT}% platform fee; the rest is paid out to your bank
        via Stripe.
      </p>
      {unavailable && (
        <p className="mt-3 rounded border border-yellow-600/40 bg-yellow-50 p-3 text-sm">
          Payout setup is temporarily unavailable — The Guild team is finishing
          the payments configuration. Your earnings are safe; try again soon.
        </p>
      )}
      <div className="mt-3 rounded border border-neutral-300 p-4 text-sm">
        {ready ? (
          <p>
            <span className="font-medium text-emerald-700">
              ✓ Payouts active.
            </span>{" "}
            Earnings from paid bookings are transferred automatically.
          </p>
        ) : (
          <form action={action}>
            <p className="text-neutral-600">
              {hasAccount
                ? "Your payout setup isn't finished — Stripe needs a few more details."
                : "Set up payouts to receive your earnings automatically. Handled securely by Stripe."}
            </p>
            <button
              type="submit"
              className="mt-3 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
            >
              {hasAccount ? "Finish payout setup" : "Set up payouts"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
