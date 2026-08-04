import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n";
import { dict } from "@/lib/dictionaries";
import { LangSwitcher } from "../../lang-switcher";
import Image from "next/image";

export const metadata = { title: "Dashboard — The Guild" };

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-neutral-800 p-4">
      <p className="font-display text-2xl font-extrabold text-guild-yellow">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{label}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const lang = await getLang();
  const t = dict(lang).dashboard;
  const c = t.console;

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
      supabase.from("barbershops").select("id, status").eq("owner_id", user.id).maybeSingle(),
      supabase
        .from("private_barbers")
        .select("profile_id, status")
        .eq("profile_id", user.id)
        .maybeSingle(),
    ]);

  const role = profile?.role ?? "client";
  const isStaff = (staffRows?.length ?? 0) > 0;
  const isAdmin = role === "admin";
  const nowIso = new Date().toISOString();

  // Brand-new account with no chosen path yet → role-choice screen.
  if (
    role === "client" &&
    !profile?.onboarding_completed_at &&
    !ownBarber &&
    !ownShop &&
    !isStaff
  ) {
    redirect("/welcome");
  }

  // ── Role console stats (only the queries the role needs) ──────────────────
  let consoleBlock: React.ReactNode = null;

  if (role === "client") {
    const { data: next } = await supabase
      .from("bookings")
      .select("scheduled_at, barbershops(name)")
      .eq("client_id", user.id)
      .in("status", ["pending", "confirmed"])
      .gte("scheduled_at", nowIso)
      .order("scheduled_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const shopName = (next as { barbershops?: { name?: string } | null } | null)?.barbershops
      ?.name;
    consoleBlock = (
      <div className="mt-8 border border-neutral-800 p-4">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-xs uppercase tracking-wide text-neutral-500">{c.client.heading}</p>
          {profile?.tier === "premium" && (
            <span className="text-xs font-medium text-guild-yellow">{c.client.premiumBadge}</span>
          )}
        </div>
        {next ? (
          <p className="mt-2 font-medium">
            {new Date(next.scheduled_at).toLocaleString(lang === "es" ? "es" : "en-US", {
              dateStyle: "full",
              timeStyle: "short",
            })}
            {shopName ? ` — ${shopName}` : ""}
          </p>
        ) : (
          <div className="mt-2">
            <p className="text-sm text-neutral-400">{c.client.noUpcoming}</p>
            <Link href="/shops" className="btn btn-outline mt-2 border-guild-yellow/60 px-3 py-1.5 text-xs text-guild-yellow">
              {c.client.bookCta}
            </Link>
          </div>
        )}
      </div>
    );
  } else if (role === "barbershop_owner") {
    const shopId = ownShop?.id;
    const [{ count: upcoming }, { count: services }, { count: staff }] = shopId
      ? await Promise.all([
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .eq("barbershop_id", shopId)
            .in("status", ["pending", "confirmed"])
            .gte("scheduled_at", nowIso),
          supabase
            .from("services")
            .select("id", { count: "exact", head: true })
            .eq("barbershop_id", shopId)
            .eq("active", true),
          supabase
            .from("barbershop_staff")
            .select("id", { count: "exact", head: true })
            .eq("barbershop_id", shopId),
        ])
      : [{ count: null }, { count: null }, { count: null }];
    consoleBlock = (
      <section className="mt-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">{c.shopOwner.heading}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={c.shopOwner.status} value={ownShop?.status ?? c.shopOwner.noShop} />
          <StatTile label={c.shopOwner.upcoming} value={upcoming ?? 0} />
          <StatTile label={c.shopOwner.services} value={services ?? 0} />
          <StatTile label={c.shopOwner.staff} value={staff ?? 0} />
        </div>
      </section>
    );
  } else if (role === "private_barber") {
    const [{ count: upcoming }, { count: services }, { count: certs }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("private_barber_id", user.id)
        .in("status", ["pending", "confirmed"])
        .gte("scheduled_at", nowIso),
      supabase
        .from("services")
        .select("id", { count: "exact", head: true })
        .eq("private_barber_id", user.id)
        .eq("active", true),
      supabase
        .from("barber_certifications")
        .select("id", { count: "exact", head: true })
        .eq("barber_id", user.id),
    ]);
    consoleBlock = (
      <section className="mt-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">{c.barber.heading}</p>
        <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatTile label={c.barber.status} value={ownBarber?.status ?? c.barber.noProfile} />
          <StatTile label={c.barber.upcoming} value={upcoming ?? 0} />
          <StatTile label={c.barber.services} value={services ?? 0} />
          <StatTile label={c.barber.certifications} value={certs ?? 0} />
        </div>
      </section>
    );
  } else if (role === "event_manager") {
    const { data: events } = await supabase
      .from("events")
      .select("id, status")
      .eq("manager_id", user.id);
    const eventIds = events?.map((e) => e.id) ?? [];
    const { count: regs } = eventIds.length
      ? await supabase
          .from("event_registrations")
          .select("event_id", { count: "exact", head: true })
          .in("event_id", eventIds)
      : { count: 0 };
    consoleBlock = (
      <section className="mt-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          {c.eventManager.heading}
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <StatTile
            label={c.eventManager.liveEvents}
            value={events?.filter((e) => e.status === "live").length ?? 0}
          />
          <StatTile label={c.eventManager.totalEvents} value={events?.length ?? 0} />
          <StatTile label={c.eventManager.registrations} value={regs ?? 0} />
        </div>
      </section>
    );
  } else if (isAdmin) {
    const [{ count: pendingShops }, { count: pendingBarbers }, { count: newLeads }] =
      await Promise.all([
        supabase
          .from("barbershops")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("private_barbers")
          .select("profile_id", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase.from("b2b_leads").select("id", { count: "exact", head: true }).eq("status", "new"),
      ]);
    consoleBlock = (
      <section className="mt-8">
        <p className="text-xs uppercase tracking-wide text-neutral-500">{c.admin.heading}</p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          <StatTile label={c.admin.pendingShops} value={pendingShops ?? 0} />
          <StatTile label={c.admin.pendingBarbers} value={pendingBarbers ?? 0} />
          <StatTile label={c.admin.newLeads} value={newLeads ?? 0} />
        </div>
      </section>
    );
  }

  // ── Sections, ordered per role (primary surfaces first) ───────────────────
  const s = t.sections;
  const shops = { href: "/shops", ...s.shops };
  const barbers = { href: "/barbers", ...s.barbers };
  const events = { href: "/events", ...s.events };
  const myBarber = { href: "/my-barber", ...s.myBarber };
  const myShop = ownShop
    ? { href: "/my-shop", ...s.myShop }
    : isStaff
      ? { href: "/my-shop", ...s.myShopStaff }
      : { href: "/my-shop", ...s.listShop };

  // The bottom nav already covers each role's primary surfaces — the home
  // shows only what the nav doesn't, so it reads as a home, not a site map.
  let sections;
  switch (role) {
    case "barbershop_owner":
      sections = [events];
      if (ownBarber) sections.unshift(myBarber);
      break;
    case "private_barber":
      sections = [barbers, events];
      if (ownShop || isStaff) sections.unshift(myShop);
      break;
    case "event_manager":
      sections = [shops, barbers];
      if (ownBarber) sections.push(myBarber);
      break;
    case "admin":
      sections = [shops, barbers, events];
      break;
    default: {
      sections = [events];
      if (profile?.tier !== "premium") sections.unshift({ href: "/premium", ...s.premium });
      // ownBarber / shop-staff clients get those surfaces in the bottom nav —
      // only plain clients see the "list your shop" invitation here.
      if (!ownBarber && !ownShop && !isStaff) sections.push(myShop);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 bg-guild-black px-6 py-16 text-white">
      <div className="flex items-center justify-between gap-3">
        <Image
          src="/brand/logo-on-dark.png"
          alt="The Guild"
          width={1005}
          height={362}
          priority
          className="h-6 w-auto"
        />
        <LangSwitcher current={lang} />
      </div>
      <h1 className="mt-2 text-2xl font-semibold">
        {t.welcome}
        {profile?.first_name ? `, ${profile.first_name}` : ""}
      </h1>

      {!profile?.onboarding_completed_at ? (
        <div className="mt-8 border border-guild-yellow/40 p-4 text-sm">
          <p className="font-medium">{t.finishProfileTitle}</p>
          <p className="mt-1 text-neutral-400">{t.finishProfileBlurb}</p>
          <Link
            href="/onboarding"
            className="btn btn-primary mt-3"
          >
            {t.finishProfileCta}
          </Link>
        </div>
      ) : (
        <>
          {consoleBlock}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {sections.map((sec) => (
              <Link
                key={sec.href + sec.title}
                href={sec.href}
                className="border border-neutral-800 p-4 hover:border-guild-yellow"
              >
                <p className="flex items-center justify-between font-bold uppercase tracking-wide">
                {sec.title}
                <span aria-hidden className="text-neutral-600">→</span>
              </p>
                <p className="mt-1 text-sm text-neutral-400">{sec.blurb}</p>
              </Link>
            ))}
          </div>
        </>
      )}

    </main>
  );
}
