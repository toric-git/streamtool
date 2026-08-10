import { readdirSync } from "fs";
import path from "path";
import { cuteColorAt } from "@/lib/sounds/button-colors";
import type { DefaultStreamSound } from "@/lib/sounds/default-stream-sounds";

export const PUBLIC_SOUND_DIR = path.join(process.cwd(), "public", "sound");

const AUDIO_EXT = /\.(mp3|wav|ogg)$/i;

export type PublicLibrarySound = DefaultStreamSound & {
  /** Browser URL under /sound/... */
  publicUrl: string;
};

export function displayNameFromSoundFile(file: string): string {
  const base = path.basename(file).replace(AUDIO_EXT, "").trim();
  return (base.length > 0 ? base : path.basename(file)).slice(0, 40);
}

/** Safe basename-only check (blocks path traversal). */
export function isSafePublicSoundFileName(file: string): boolean {
  if (!file || file !== path.basename(file)) return false;
  if (file.includes("\0") || file.includes("..")) return false;
  return AUDIO_EXT.test(file);
}

export function listPublicLibrarySounds(): PublicLibrarySound[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(PUBLIC_SOUND_DIR);
  } catch (err) {
    console.error("[sounds] public/sound missing", err);
    return [];
  }

  return entries
    .filter((file) => isSafePublicSoundFileName(file))
    .sort((a, b) => a.localeCompare(b, "ja"))
    .map((file, index) => {
      const color = cuteColorAt(index);
      return {
        file,
        name: displayNameFromSoundFile(file),
        buttonColor: color.hex,
        textColor: color.text,
        publicUrl: `/sound/${encodeURIComponent(file)}`,
      };
    });
}

export function findPublicLibrarySound(
  file: string,
): PublicLibrarySound | undefined {
  if (!isSafePublicSoundFileName(file)) return undefined;
  return listPublicLibrarySounds().find((s) => s.file === file);
}

export function publicSoundAbsolutePath(file: string): string | null {
  if (!isSafePublicSoundFileName(file)) return null;
  return path.join(PUBLIC_SOUND_DIR, file);
}
