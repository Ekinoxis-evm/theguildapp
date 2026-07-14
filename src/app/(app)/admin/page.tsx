import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import { ApprovalList } from "./approval-list";
import { BarberApprovals } from "./barber-approvals";
import { CertVerifications } from "./cert-verifications";
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

  const [
    { data: pending },
    { data: pendingBarbers },
    { data: leads },
    { data: pendingCerts },
  ] = await Promise.all([
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
    supabase
      .from("barber_certifications")
      .select(
        "id, title, issuer, issued_on, file_path, created_at, private_barbers!barber_certifications_barber_id_fkey(profiles!private_barbers_profile_id_fkey(first_name, last_name))"
      )
      .is("verified_at", null)
      .order("created_at"),
  ]);

  const certsWithDocs = await Promise.all(
    (pendingCerts ?? []).map(async (c) => {
      let docUrl: string | null = null;
      if (c.file_path) {
        const { data } = await supabase.storage
          .from("barber-certs")
          .createSignedUrl(c.file_path, SIGNED_URL_TTL_SECONDS);
        docUrl = data?.signedUrl ?? null;
      }
      const p = c.private_barbers?.profiles;
      return {
        id: c.id,
        title: c.title,
        issuer: c.issuer,
        issued_on: c.issued_on,
        created_at: c.created_at,
        barberName:
          [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "Guild barber",
        docUrl,
      };
    })
  );

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
      <CertVerifications initial={certsWithDocs} />
      <LeadsList initial={leads ?? []} />
      <TierManager />
      <PromoteManager />
    </main>
  );
}
