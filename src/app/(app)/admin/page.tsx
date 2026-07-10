import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApprovalList } from "./approval-list";
import { BarberApprovals } from "./barber-approvals";
import { PromoteManager } from "./promote-manager";
import { TierManager } from "./tier-manager";
import { LeadsList } from "./leads-list";

export const metadata = { title: "Admin — The Guild" };

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") redirect("/dashboard");

  const [{ data: pending }, { data: pendingBarbers }, { data: leads }] =
    await Promise.all([
      supabase
        .from("barbershops")
        .select("id, name, phone, description, created_at, owner_id")
        .eq("status", "pending")
        .order("created_at"),
      supabase
        .from("private_barbers")
        .select(
          "profile_id, bio, base_price_cents, created_at, profiles!private_barbers_profile_id_fkey(first_name, last_name, phone)"
        )
        .eq("status", "pending")
        .order("created_at"),
      supabase
        .from("b2b_leads")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Admin</h1>
      <h2 className="mt-8 text-lg font-medium">Barbershop applications</h2>
      <ApprovalList initial={pending ?? []} />
      <BarberApprovals initial={pendingBarbers ?? []} />
      <LeadsList initial={leads ?? []} />
      <TierManager />
      <PromoteManager />
    </main>
  );
}
