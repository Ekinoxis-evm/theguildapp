import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n";
import { dict } from "@/lib/dictionaries";
import { LangSwitcher } from "../../lang-switcher";

export const metadata = { title: "Dashboard — The Guild" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const lang = await getLang();
  const t = dict(lang).dashboard;

  // Idempotent: links any staff roster rows matching this email to the account.
  await supabase.rpc("link_staff_by_email");

  const [{ data: profile }, { data: staffRows }, { data: ownShop }, { data: ownBarber }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, role, tier, onboarding_completed_at")
        .eq("id", user.id)
        .single(),
      supabase.from("barbershop_staff").select("barbershop_id").eq("profile_id", user.id),
      supabase.from("barbershops").select("id").eq("owner_id", user.id).maybeSingle(),
      supabase.from("private_barbers").select("profile_id").eq("profile_id", user.id).maybeSingle(),
    ]);

  const isStaff = (staffRows?.length ?? 0) > 0;
  const isAdmin = profile?.role === "admin";

  const sections = [
    { href: "/shops", ...t.sections.shops },
    { href: "/barbers", ...t.sections.barbers },
    { href: "/bookings", ...t.sections.bookings },
    { href: "/events", ...t.sections.events },
    { href: "/profile", ...t.sections.profile },
  ];
  if (profile?.role === "client" && profile.tier !== "premium") {
    sections.push({ href: "/premium", ...t.sections.premium });
  }
  if (ownBarber) {
    sections.push({ href: "/my-barber", ...t.sections.myBarber });
  }
  if (profile?.role === "event_manager" || isAdmin) {
    sections.push({ href: "/my-events", ...t.sections.myEvents });
  }
  if (ownShop || isStaff) {
    sections.push({
      href: "/my-shop",
      ...(ownShop ? t.sections.myShop : t.sections.myShopStaff),
    });
  } else {
    sections.push({ href: "/my-shop", ...t.sections.listShop });
  }
  if (isAdmin) {
    sections.push({ href: "/admin", ...t.sections.admin });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-xs uppercase tracking-widest text-yellow-600">
          The Guild — Grooming Standard
        </p>
        <LangSwitcher current={lang} />
      </div>
      <h1 className="mt-2 text-2xl font-semibold">
        {t.welcome}
        {profile?.first_name ? `, ${profile.first_name}` : ""}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {t.signedInAs} {user.email} · {profile?.role ?? "client"}
        {profile?.role === "client" ? ` (${profile?.tier})` : ""}
      </p>

      {!profile?.onboarding_completed_at ? (
        <div className="mt-8 rounded border border-yellow-600/40 bg-yellow-50 p-4 text-sm">
          <p className="font-medium">{t.finishProfileTitle}</p>
          <p className="mt-1 text-neutral-600">{t.finishProfileBlurb}</p>
          <Link
            href="/onboarding"
            className="mt-3 inline-block rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
          >
            {t.finishProfileCta}
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <Link
              key={s.href + s.title}
              href={s.href}
              className="rounded border border-neutral-300 p-4 hover:border-neutral-900"
            >
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{s.blurb}</p>
            </Link>
          ))}
        </div>
      )}

      <form action="/auth/signout" method="post" className="mt-10">
        <button
          type="submit"
          className="rounded border border-neutral-300 px-4 py-2 text-sm"
        >
          {t.signOut}
        </button>
      </form>
    </main>
  );
}
