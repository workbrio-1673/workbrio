"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AvatarUploadProps = {
  userId: string;
  currentUrl: string | null;
  /** Called with the new public URL after a successful upload. */
  onUploaded: (url: string) => void;
  size?: number;
};

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/** Circular avatar with a click-to-upload overlay (Workbrio avatars bucket). */
export function AvatarUpload({ userId, currentUrl, onUploaded, size = 128 }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    if (!ACCEPTED.includes(file.type)) {
      setError("Please choose a JPG, PNG, WebP or GIF image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      // Cache-bust so the new photo shows immediately.
      onUploaded(`${data.publicUrl}?t=${Date.now()}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Upload profile photo"
        className="group relative block rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500"
        style={{ width: size, height: size }}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentUrl}
            alt="Profile photo"
            className="h-full w-full rounded-full object-cover ring-4 ring-brand-500/20"
            style={{ width: size, height: size }}
          />
        ) : (
          <span
            className="flex h-full w-full items-center justify-center rounded-full bg-gradient-brand text-4xl font-extrabold text-white"
            style={{ width: size, height: size }}
            aria-hidden
          >
            ?
          </span>
        )}
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink-950/60 text-sm font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? "Uploading…" : "Change photo"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
