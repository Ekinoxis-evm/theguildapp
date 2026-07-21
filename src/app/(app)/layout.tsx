import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n";
import { dict } from "@/lib/dictionaries";
import { BottomNav, type NavItem } from "./bottom-nav";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated visitors get redirected by each page; no shell for them.
  if (!user)
    return <div className="flex min-h-full flex-1 flex-col bg-guild-black text-white">{children}</div>;

  const lang = await getLang();
  const n = dict(lang).nav;

  const [{ data: profile }, { data: ownShop }, { data: ownBarber }, { data: staffRows }] =
    await Promise.all([
      supabase.from("profiles").select("role").eq("id", user.id).single(),
      supabase.from("barbershops").select("id").eq("owner_id", user.id).maybeSingle(),
      supabase
        .from("private_barbers")
        .select("profile_id")
        .eq("profile_id", user.id)
        .maybeSingle(),
      supabase.from("barbershop_staff").select("barbershop_id").eq("profile_id", user.id),
    ]);

  const role = profile?.role ?? "client";
  const isStaff = (staffRows?.length ?? 0) > 0;

  const home = { href: "/dashboard", label: n.home };
  const bookings = { href: "/bookings", label: n.bookings };
  const profileItem = { href: "/profile", label: n.profile };

  let items: NavItem[];
  if (role === "admin") {
    items = [home, { href: "/admin", label: n.admin }, { href: "/my-events", label: n.myEvents }, bookings, profileItem];
  } else if (role === "event_manager") {
    items = [home, { href: "/my-events", label: n.myEvents }, { href: "/events", label: n.events }, bookings, profileItem];
  } else if (role === "barbershop_owner" || ownShop || isStaff) {
    items = [home, { href: "/my-shop", label: n.myShop }, bookings, { href: "/barbers", label: n.barbers }, profileItem];
  } else if (role === "private_barber" || ownBarber) {
    items = [home, { href: "/my-barber", label: n.myBarber }, bookings, { href: "/shops", label: n.shops }, profileItem];
  } else {
    items = [home, { href: "/shops", label: n.shops }, { href: "/barbers", label: n.barbers }, bookings, profileItem];
  }

  return (
    <>
      <div className="flex min-h-full flex-1 flex-col bg-guild-black pb-12 text-white">{children}</div>
      <BottomNav items={items} />
    </>
  );
}
