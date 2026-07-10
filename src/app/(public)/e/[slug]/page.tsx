import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/format";
import { RegisterButton } from "./register-button";

export const metadata = { title: "Event — The Guild" };

export default async function EventLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  // Live events are publicly readable (QR flow starts pre-signup).
  const { data: event } = await supabase
    .from("events")
    .select("id, brand_name, title, venue, starts_at, ends_at, status")
    .eq("qr_slug", slug)
    .eq("status", "live")
    .maybeSingle();
  if (!event) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let registered = false;
  if (user) {
    const { data: reg } = await supabase
      .from("event_registrations")
      .select("registered_at")
      .eq("event_id", event.id)
      .eq("profile_id", user.id)
      .maybeSingle();
    registered = Boolean(reg);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-yellow-600">
        The Guild × {event.brand_name}
      </p>
      <h1 className="mt-2 text-2xl font-semibold">{event.title}</h1>
      <p className="mt-3 text-sm text-neutral-600">
        {event.venue}
        <span className="block">
          {formatDateTime(event.starts_at)} — {formatDateTime(event.ends_at)}
        </span>
      </p>

      {!user ? (
        <div className="mt-8">
          <p className="text-sm text-neutral-600">
            Create your Guild account to claim your grooming service at this
            event.
          </p>
          <Link
            href={`/login?next=/e/${slug}`}
            className="mt-4 block w-full rounded bg-neutral-900 px-4 py-2 text-center text-sm font-medium text-white"
          >
            Sign up / Sign in
          </Link>
        </div>
      ) : registered ? (
        <div className="mt-8 rounded border border-neutral-300 p-4 text-sm">
          <p className="font-medium">You&apos;re registered ✂️</p>
          <p className="mt-1 text-neutral-600">
            Show this screen at The Guild station to claim your service.
          </p>
          <Link href="/events" className="mt-2 inline-block underline">
            My events
          </Link>
        </div>
      ) : (
        <RegisterButton eventId={event.id} userId={user.id} />
      )}
    </main>
  );
}
