import { Howl, Howler } from "howler";
import { computePlaybackGain } from "@/lib/audio/playback-math";

/** Valid PCM WAV (16-bit mono silence). Empty data chunks trigger load errors in some browsers. */
const SILENT_WAV =
  "data:audio/wav;base64,UklGRqQAAABXQVZFZm10IBAAAAABAAEAIlYAAESsAAACABAAZGF0YYAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";

async function resumeHowlerContext(): Promise<boolean> {
  try {
    const ctx = Howler.ctx;
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    return ctx.state === "running";
  } catch {
    return false;
  }
}

export type AudioEngineOptions = {
  maxSimultaneous: number;
  maxCachedSounds?: number;
  getSignedUrl: (audioPath: string) => Promise<string>;
  volumeLayers: {
    roomVolume: number;
    deviceOrObsVolume: number;
  };
};

type CachedHowl = {
  howl: Howl;
  audioPath: string;
  lastUsedAt: number;
};

export type PlayRequest = {
  soundId: string;
  audioPath: string;
  soundVolume: number;
  eventVolume: number;
  clientEventId: string;
  /** When true, clip loops until stop() (toggle_loop / hold-to-play). */
  loop?: boolean;
};

export interface AudioEngineLike {
  unlock(): Promise<boolean>;
  isUnlocked(): boolean;
  preload(soundId: string, audioPath: string): Promise<void>;
  play(request: PlayRequest): Promise<void>;
  stop(soundId: string): void;
  stopAll(): void;
  setVolumeLayers(layers: AudioEngineOptions["volumeLayers"]): void;
  getPlayingSoundIds(): string[];
  dispose(): void;
}

export class AudioEngine implements AudioEngineLike {
  private unlocked = false;
  private cache = new Map<string, CachedHowl>();
  private playing = new Map<string, Set<number>>();
  private options: AudioEngineOptions;

  constructor(options: AudioEngineOptions) {
    this.options = {
      maxCachedSounds: 24,
      ...options,
    };
  }

  setVolumeLayers(layers: AudioEngineOptions["volumeLayers"]) {
    this.options.volumeLayers = layers;
  }

  isUnlocked(): boolean {
    return this.unlocked;
  }

  async unlock(): Promise<boolean> {
    if (this.unlocked) return true;

    try {
      // Called from an explicit user gesture (AudioEnableGate). Prefer success after
      // attempting silent playback + AudioContext resume — do not fail on flaky
      // load/end events for tiny clips (previous empty WAV caused false E5004s).
      await new Promise<void>((resolve) => {
        let done = false;
        let howl: Howl | null = null;

        const doneOnce = () => {
          if (done) return;
          done = true;
          try {
            howl?.unload();
          } catch {
            /* ignore */
          }
          resolve();
        };

        howl = new Howl({
          src: [SILENT_WAV],
          format: ["wav"],
          volume: 0,
          onplay: doneOnce,
          onend: doneOnce,
          onloaderror: () => {
            void resumeHowlerContext().finally(doneOnce);
          },
          onplayerror: () => {
            howl?.once("unlock", () => {
              try {
                howl?.play();
              } catch {
                /* ignore */
              }
            });
            void resumeHowlerContext().finally(doneOnce);
          },
        });

        void resumeHowlerContext();
        try {
          howl.play();
        } catch {
          doneOnce();
        }

        setTimeout(doneOnce, 400);
      });

      this.unlocked = true;
      return true;
    } catch (err) {
      console.error("[audio] unlock failed", err);
      return false;
    }
  }

  async preload(soundId: string, audioPath: string): Promise<void> {
    await this.ensureHowl(soundId, audioPath);
  }

  async play(request: PlayRequest): Promise<void> {
    if (!this.unlocked) {
      throw new Error("audio_locked");
    }

    this.enforceSimultaneousLimit();
    const howl = await this.ensureHowl(request.soundId, request.audioPath);
    const gain = computePlaybackGain({
      soundVolume: request.soundVolume,
      roomVolume: this.options.volumeLayers.roomVolume,
      deviceOrObsVolume: this.options.volumeLayers.deviceOrObsVolume,
      eventVolume: request.eventVolume,
    });

    howl.volume(gain);
    howl.loop(Boolean(request.loop));
    const instanceId = howl.play();
    const set = this.playing.get(request.soundId) ?? new Set<number>();
    set.add(instanceId);
    this.playing.set(request.soundId, set);

    if (!request.loop) {
      howl.once(
        "end",
        () => {
          set.delete(instanceId);
          if (set.size === 0) this.playing.delete(request.soundId);
        },
        instanceId,
      );
    }
  }

  stop(soundId: string): void {
    const cached = this.cache.get(soundId);
    if (!cached) return;
    cached.howl.stop();
    this.playing.delete(soundId);
  }

  stopAll(): void {
    for (const cached of this.cache.values()) {
      cached.howl.stop();
    }
    this.playing.clear();
  }

  getPlayingSoundIds(): string[] {
    return [...this.playing.keys()];
  }

  dispose(): void {
    this.stopAll();
    for (const cached of this.cache.values()) {
      cached.howl.unload();
    }
    this.cache.clear();
  }

  private enforceSimultaneousLimit() {
    while (this.countPlayingInstances() >= this.options.maxSimultaneous) {
      const oldest = this.playing.keys().next().value;
      if (!oldest) break;
      this.stop(oldest);
    }
  }

  private countPlayingInstances(): number {
    let total = 0;
    for (const set of this.playing.values()) total += set.size;
    return total;
  }

  private async ensureHowl(soundId: string, audioPath: string): Promise<Howl> {
    const existing = this.cache.get(soundId);
    if (existing && existing.audioPath === audioPath) {
      existing.lastUsedAt = Date.now();
      return existing.howl;
    }

    if (existing) {
      existing.howl.unload();
      this.cache.delete(soundId);
    }

    this.evictIfNeeded();

    const url = await this.options.getSignedUrl(audioPath);
    const howl = await new Promise<Howl>((resolve, reject) => {
      const instance = new Howl({
        src: [url],
        html5: true,
        preload: true,
        onload: () => resolve(instance),
        onloaderror: (_id, err) => reject(err ?? new Error("load_error")),
      });
    });

    this.cache.set(soundId, {
      howl,
      audioPath,
      lastUsedAt: Date.now(),
    });
    return howl;
  }

  private evictIfNeeded() {
    const max = this.options.maxCachedSounds ?? 24;
    while (this.cache.size >= max) {
      let oldestId: string | null = null;
      let oldestAt = Number.POSITIVE_INFINITY;
      for (const [id, entry] of this.cache) {
        if (this.playing.has(id)) continue;
        if (entry.lastUsedAt < oldestAt) {
          oldestAt = entry.lastUsedAt;
          oldestId = id;
        }
      }
      if (!oldestId) break;
      this.cache.get(oldestId)?.howl.unload();
      this.cache.delete(oldestId);
    }
  }
}
