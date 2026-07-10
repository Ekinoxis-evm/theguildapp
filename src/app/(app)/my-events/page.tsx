import Link from "next/link";
import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { CreateEventForm } from "./create-event-form";
import { EventCard, type ManagedEvent } from "./event-card";

export const metadata = { title: "My events — The Guild" };

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/my-events");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || !["event_manager", "admin"].includes(profile.role)) {
    redirect("/dashboard");
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("manager_id", user.id)
    .order("starts_at", { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const enriched: ManagedEvent[] = [];
  for (const event of events ?? []) {
    const registrationUrl = `${appUrl}/e/${event.qr_slug}`;
    const [{ data: attendees }, qrDataUrl] = await Promise.all([
      supabase.rpc("event_attendees", { p_event_id: event.id }),
      QRCode.toDataURL(registrationUrl, { margin: 1, width: 240 }),
    ]);
    enriched.push({
      ...event,
      registrationUrl,
      qrDataUrl,
      attendees: attendees ?? [],
    });
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href="/dashboard" className="underline">
          ← Dashboard
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">My events</h1>

      <CreateEventForm managerId={user.id} />

      <div className="mt-10 space-y-6">
        {enriched.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
        {enriched.length === 0 && (
          <p className="text-sm text-neutral-500">No events yet — create your first one above.</p>
        )}
      </div>
    </main>
  );
}
