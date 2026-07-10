import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS, PHOTO_POSITIONS } from "@/lib/storage";
import { AtHomeBookingForm } from "./booking-form";

export const metadata = { title: "Book at home — The Guild" };

export default async function AtHomeBookPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const { id } = await params;
  const { service: serviceId } = await searchParams;
  if (!serviceId) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/barbers/${id}/book?service=${serviceId}`);

  const [{ data: profile }, { data: barber }, { data: stylePhotos }, { data: savedAddress }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("tier, onboarding_completed_at")
        .eq("id", user.id)
        .single(),
      supabase
        .from("private_barbers")
        .select(
          "profile_id, services(id, name, price_cents, currency, duration_minutes, active), profiles!private_barbers_profile_id_fkey(first_name, last_name)"
        )
        .eq("profile_id", id)
        .eq("status", "approved")
        .maybeSingle(),
      supabase
        .from("style_photos")
        .select("position, storage_path, updated_at")
        .eq("profile_id", user.id),
      supabase
        .from("client_addresses")
        .select("street_address, unit, city, state, zip_code")
        .eq("profile_id", user.id)
        .eq("is_default", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  if (!barber) notFound();
  if (profile?.tier !== "premium") redirect("/barbers");
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const service = barber.services.find((s) => s.id === serviceId && s.active);
  if (!service) notFound();

  const barberName =
    [barber.profiles?.first_name, barber.profiles?.last_name].filter(Boolean).join(" ") ||
    "Guild barber";

  const photosComplete = PHOTO_POSITIONS.every((p) =>
    stylePhotos?.some((sp) => sp.position === p)
  );
  const oldestUpdate = (stylePhotos ?? []).map((p) => p.updated_at).sort()[0] ?? null;
  const photoUrls: { position: string; url: string }[] = [];
  for (const photo of stylePhotos ?? []) {
    const { data } = await supabase.storage
      .from("style-photos")
      .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS);
    if (data) photoUrls.push({ position: photo.position, url: data.signedUrl });
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-16">
      <p className="text-sm">
        <Link href={`/barbers/${barber.profile_id}`} className="underline">
          ← {barberName}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Book {service.name}</h1>
      <p className="mt-1 text-sm text-neutral-500">At your address, by {barberName}.</p>

      <AtHomeBookingForm
        barberId={barber.profile_id}
        serviceId={service.id}
        serviceName={service.name}
        priceCents={service.price_cents}
        currency={service.currency}
        durationMinutes={service.duration_minutes}
        photosComplete={photosComplete}
        oldestPhotoUpdate={oldestUpdate}
        photoUrls={photoUrls}
        savedAddress={savedAddress}
      />
    </main>
  );
}
