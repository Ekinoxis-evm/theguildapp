import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";

export type PhotoPosition = Database["public"]["Enums"]["photo_position"];

export const PHOTO_POSITIONS: readonly PhotoPosition[] = [
  "front",
  "left",
  "right",
  "back",
] as const;

export const PHOTO_POSITION_LABELS: Record<PhotoPosition, string> = {
  front: "Front",
  left: "Left side",
  right: "Right side",
  back: "Back",
};

export const SIGNED_URL_TTL_SECONDS = 600;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function extensionFor(file: File): string {
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new Error("Please use a JPEG, PNG, or WebP image.");
  return ext;
}

async function uploadOwned(
  bucket: "avatars" | "style-photos" | "barber-photos",
  path: string,
  file: File,
  previousPath: string | null
) {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error(error.message);
  // Same logical slot can change extension between uploads; drop the orphan.
  if (previousPath && previousPath !== path) {
    await supabase.storage.from(bucket).remove([previousPath]);
  }
  return path;
}

export async function uploadAvatar(
  userId: string,
  file: File,
  previousPath: string | null
): Promise<string> {
  const path = `${userId}/avatar.${extensionFor(file)}`;
  await uploadOwned("avatars", path, file, previousPath);
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ avatar_path: path })
    .eq("id", userId);
  if (error) throw new Error(error.message);
  return path;
}

export async function uploadBarberPhoto(
  userId: string,
  kind: "self" | "setup",
  file: File,
  previousPath: string | null
): Promise<string> {
  const path = `${userId}/${kind}.${extensionFor(file)}`;
  await uploadOwned("barber-photos", path, file, previousPath);
  const supabase = createClient();
  const { error } = await supabase
    .from("private_barbers")
    .update(kind === "self" ? { self_photo_path: path } : { setup_photo_path: path })
    .eq("profile_id", userId);
  if (error) throw new Error(error.message);
  return path;
}

export async function uploadStylePhoto(
  userId: string,
  position: PhotoPosition,
  file: File,
  previousPath: string | null
): Promise<string> {
  const path = `${userId}/style-${position}.${extensionFor(file)}`;
  await uploadOwned("style-photos", path, file, previousPath);
  const supabase = createClient();
  const { error } = await supabase.from("style_photos").upsert(
    {
      profile_id: userId,
      position,
      storage_path: path,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profile_id,position" }
  );
  if (error) throw new Error(error.message);
  return path;
}
