import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS, PHOTO_POSITIONS } from "@/lib/storage";
import { BookingForm } from "./booking-form";

export const metadata = { title: "Book — The Guild" };

export default async function BookPage({
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
  if (!user) redirect(`/login?next=/shops/${id}/book?service=${serviceId}`);

  const [{ data: shop }, { data: stylePhotos }, { data: profile }, { data: staff }] =
    await Promise.all([
      supabase
        .from("barbershops")
        .select(
          "id, name, barbershop_locations(id, formatted_address, city, state), services(id, name, price_cents, currency, duration_minutes, active)"
        )
        .eq("id", id)
        .eq("status", "approved")
        .maybeSingle(),
      supabase
        .from("style_photos")
        .select("position, storage_path, updated_at")
        .eq("profile_id", user.id),
      supabase
        .from("profiles")
        .select("onboarding_completed_at")
        .eq("id", user.id)
        .single(),
      supabase.rpc("shop_staff_directory", { p_shop_id: id }),
    ]);

  if (!shop) notFound();
  const service = shop.services.find((s) => s.id === serviceId && s.active);
  if (!service) notFound();

  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const photosComplete =
    PHOTO_POSITIONS.every((p) => stylePhotos?.some((sp) => sp.position === p)) ?? false;
  const oldestUpdate = (stylePhotos ?? [])
    .map((p) => p.updated_at)
    .sort()[0] ?? null;

  // Signed previews so the client can eyeball whether the photos are current.
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
        <Link href={`/shops/${shop.id}`} className="underline">
          ← {shop.name}
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Book {service.name}</h1>

      <BookingForm
        shopId={shop.id}
        serviceId={service.id}
        serviceName={service.name}
        priceCents={service.price_cents}
        currency={service.currency}
        durationMinutes={service.duration_minutes}
        locations={shop.barbershop_locations}
        staff={staff ?? []}
        photosComplete={photosComplete}
        oldestPhotoUpdate={oldestUpdate}
        photoUrls={photoUrls}
      />
    </main>
  );
}
