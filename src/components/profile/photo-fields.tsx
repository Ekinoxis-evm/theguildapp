"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  PHOTO_POSITIONS,
  PHOTO_POSITION_LABELS,
  type PhotoPosition,
  uploadAvatar,
  uploadStylePhoto,
} from "@/lib/storage";

export type StylePhotoState = Partial<
  Record<PhotoPosition, { path: string; url: string }>
>;

export function AvatarField({
  userId,
  initialPath,
  initialUrl,
}: {
  userId: string;
  initialPath: string | null;
  initialUrl: string | null;
}) {
  const [path, setPath] = useState(initialPath);
  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const newPath = await uploadAvatar(userId, file, path);
      setPath(newPath);
      setUrl(URL.createObjectURL(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-neutral-300 bg-neutral-100 disabled:opacity-50"
        aria-label="Upload profile photo"
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element -- signed/blob URLs
          <img src={url} alt="Profile" className="h-full w-full object-cover" />
        ) : (
          <span className="text-2xl text-neutral-400">+</span>
        )}
      </button>
      <div className="text-sm">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded border border-neutral-300 px-3 py-1.5 disabled:opacity-50"
        >
          {busy ? "Uploading…" : url ? "Change photo" : "Upload photo"}
        </button>
        <p className="mt-1 text-xs text-neutral-500">JPEG, PNG, or WebP — 5 MB max.</p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={onSelect}
        className="hidden"
      />
    </div>
  );
}

export function StylePhotoGrid({
  userId,
  initial,
  onChange,
}: {
  userId: string;
  initial: StylePhotoState;
  onChange?: (photos: StylePhotoState) => void;
}) {
  const [photos, setPhotos] = useState<StylePhotoState>(initial);
  const [busy, setBusy] = useState<PhotoPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSelect(position: PhotoPosition, file: File | undefined) {
    if (!file) return;
    setError(null);
    setBusy(position);
    try {
      const path = await uploadStylePhoto(
        userId,
        position,
        file,
        photos[position]?.path ?? null
      );
      const next = {
        ...photos,
        [position]: { path, url: URL.createObjectURL(file) },
      };
      setPhotos(next);
      onChange?.(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {PHOTO_POSITIONS.map((position) => {
          const photo = photos[position];
          return (
            <label
              key={position}
              className="flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded border border-neutral-300 bg-neutral-100 text-sm"
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed/blob URLs
                <img
                  src={photo.url}
                  alt={`${PHOTO_POSITION_LABELS[position]} style photo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <span className="text-2xl text-neutral-400">+</span>
                  <span className="mt-1 text-neutral-600">
                    {busy === position
                      ? "Uploading…"
                      : PHOTO_POSITION_LABELS[position]}
                  </span>
                </>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={busy !== null}
                onChange={(e) => onSelect(position, e.target.files?.[0])}
                className="hidden"
              />
            </label>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-neutral-500">
        Tap a photo to replace it. These stay private — only you and your
        booked barber can see them.
      </p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
