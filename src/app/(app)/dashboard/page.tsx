import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard — The Guild" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, role, tier, onboarding_completed_at")
    .eq("id", user.id)
    .single();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-yellow-600">
        The Guild — Grooming Standard
      </p>
      <h1 className="mt-2 text-2xl font-semibold">
        Welcome{profile?.first_name ? `, ${profile.first_name}` : ""}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        Signed in as {user.email} · {profile?.role ?? "client"}
        {profile?.role === "client" ? ` (${profile?.tier})` : ""}
      </p>

      {!profile?.onboarding_completed_at && (
        <div className="mt-8 rounded border border-yellow-600/40 bg-yellow-50 p-4 text-sm">
          <p className="font-medium">Finish setting up your profile</p>
          <p className="mt-1 text-neutral-600">
            The onboarding wizard (profile photo, contact info, your current
            style) is coming next — roadmap item 1.4.
          </p>
        </div>
      )}

      <form action="/auth/signout" method="post" className="mt-10">
        <button
          type="submit"
          className="rounded border border-neutral-300 px-4 py-2 text-sm"
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
