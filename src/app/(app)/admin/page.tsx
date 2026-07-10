import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ApprovalList } from "./approval-list";

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

  // Admin sees own + approved via RLS; pending shops need the admin read
  // policy from the migration. Owner-scoped RLS hides others' pending shops
  // from non-admins.
  const { data: pending } = await supabase
    .from("barbershops")
    .select("id, name, phone, description, created_at, owner_id")
    .eq("status", "pending")
    .order("created_at");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Barbershop applications</h1>
      <ApprovalList initial={pending ?? []} />
    </main>
  );
}
