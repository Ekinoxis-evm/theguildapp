import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";

export const metadata = { title: "Events — The Guild" };

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/events");

  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("registered_at, service_claimed_at, events(id, brand_name, title, venue, starts_at, ends_at, status, qr_slug)")
    .eq("profile_id", user.id)
    .order("registered_at", { ascending: false });

  const rows = (registrations ?? []).filter((r) => r.events);
  const current = rows.filter((r) => r.events!.status === "live");
  const past = rows.filter((r) => r.events!.status !== "live");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Events</h1>

      <h2 className="mt-8 text-lg font-medium">Current</h2>
      <EventList rows={current} emptyText="No live events — scan a Guild QR at an activation to join." />

      {past.length > 0 && (
        <>
          <h2 className="mt-8 text-lg font-medium">History</h2>
          <EventList rows={past} emptyText="" />
        </>
      )}
    </main>
  );
}

function EventList({
  rows,
  emptyText,
}: {
  rows: {
    registered_at: string;
    service_claimed_at: string | null;
    events: {
      id: string;
      brand_name: string;
      title: string;
      venue: string;
      starts_at: string;
      ends_at: string;
      status: string;
      qr_slug: string;
    } | null;
  }[];
  emptyText: string;
}) {
  if (rows.length === 0) {
    return emptyText ? <p className="mt-3 text-sm text-neutral-500">{emptyText}</p> : null;
  }
  return (
    <ul className="mt-3 space-y-2">
      {rows.map((r) => {
        const e = r.events!;
        return (
          <li key={e.id} className="border border-neutral-800 p-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <strong>
                {e.title}{" "}
                <span className="font-normal text-neutral-500">× {e.brand_name}</span>
              </strong>
              <span className="shrink-0 text-xs uppercase tracking-wide text-neutral-500">
                {r.service_claimed_at ? "Service claimed" : e.status === "live" ? "Registered" : e.status}
              </span>
            </div>
            <p className="mt-1 text-neutral-400">
              {e.venue} · {formatDateTime(e.starts_at)}
            </p>
            {e.status === "live" && !r.service_claimed_at && (
              <Link href={`/e/${e.qr_slug}`} className="mt-1 inline-block text-xs underline">
                Show my registration
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
