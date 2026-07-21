import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import type { StylePhotoState } from "@/components/profile/photo-fields";
import { ProfileForm } from "./profile-form";

export const metadata = { title: "Profile — The Guild" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const [{ data: profile }, { data: stylePhotos }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("style_photos")
      .select("position, storage_path")
      .eq("profile_id", user.id),
  ]);
  if (!profile) redirect("/login");
  if (!profile.onboarding_completed_at) redirect("/onboarding");

  const avatarUrl = profile.avatar_path
    ? (
        await supabase.storage
          .from("avatars")
          .createSignedUrl(profile.avatar_path, SIGNED_URL_TTL_SECONDS)
      ).data?.signedUrl ?? null
    : null;

  const initialStylePhotos: StylePhotoState = {};
  for (const photo of stylePhotos ?? []) {
    const { data } = await supabase.storage
      .from("style-photos")
      .createSignedUrl(photo.storage_path, SIGNED_URL_TTL_SECONDS);
    if (data) {
      initialStylePhotos[photo.position] = {
        path: photo.storage_path,
        url: data.signedUrl,
      };
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-16">
      <p className="text-xs uppercase tracking-widest text-guild-yellow">
        The Guild — Grooming Standard
      </p>
      <h1 className="mt-2 text-2xl font-semibold">Profile</h1>
      <p className="mt-2 text-sm">
        <Link href="/dashboard" className="underline">
          ← Back to dashboard
        </Link>
      </p>
      <ProfileForm
        userId={user.id}
        profile={profile}
        avatarUrl={avatarUrl}
        initialStylePhotos={initialStylePhotos}
      />
    </main>
  );
}
