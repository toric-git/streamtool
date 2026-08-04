export async function readAudioDurationMs(file: File): Promise<number> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const durationSec = await new Promise<number>((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        resolve(audio.duration);
      };
      audio.onerror = () => {
        reject(new Error("metadata"));
      };
      audio.src = objectUrl;
    });

    if (!Number.isFinite(durationSec) || durationSec <= 0) {
      throw new Error("invalid duration");
    }
    return Math.round(durationSec * 1000);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function previewAudioFile(file: File, volume = 1): Promise<() => void> {
  const objectUrl = URL.createObjectURL(file);
  const audio = new Audio(objectUrl);
  audio.volume = Math.min(1, Math.max(0, volume));
  await audio.play();
  return () => {
    audio.pause();
    URL.revokeObjectURL(objectUrl);
  };
}
