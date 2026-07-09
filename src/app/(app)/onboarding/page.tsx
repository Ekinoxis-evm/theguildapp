import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SIGNED_URL_TTL_SECONDS } from "@/lib/storage";
import type { StylePhotoState } from "@/components/profile/photo-fields";
import { OnboardingWizard } from "./wizard";

export const metadata = { title: "Set up your profile — The Guild" };

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/onboarding");

  const [{ data: profile }, { data: stylePhotos }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("style_photos")
      .select("position, storage_path")
      .eq("profile_id", user.id),
  ]);
  if (!profile) redirect("/login");
  if (profile.onboarding_completed_at) redirect("/dashboard");

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
    <OnboardingWizard
      userId={user.id}
      profile={profile}
      avatarUrl={avatarUrl}
      initialStylePhotos={initialStylePhotos}
    />
  );
}
