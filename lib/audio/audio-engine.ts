import { Howl } from "howler";
import { computePlaybackGain } from "@/lib/audio/playback-math";

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
};

export interface AudioEngineLike {
  unlock(): Promise<boolean>;
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

  async unlock(): Promise<boolean> {
    if (this.unlocked) return true;

    return new Promise((resolve) => {
      const howl = new Howl({
        src: [
          "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=",
        ],
        volume: 0.001,
        onend: () => {
          this.unlocked = true;
          howl.unload();
          resolve(true);
        },
        onloaderror: () => {
          howl.unload();
          resolve(false);
        },
        onplayerror: () => {
          howl.unload();
          resolve(false);
        },
      });
      howl.play();
      // Fallback if silent clip ends instantly without event in some browsers
      setTimeout(() => {
        if (!this.unlocked) {
          this.unlocked = true;
          resolve(true);
        }
      }, 300);
    });
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
    const instanceId = howl.play();
    const set = this.playing.get(request.soundId) ?? new Set<number>();
    set.add(instanceId);
    this.playing.set(request.soundId, set);

    howl.once("end", () => {
      set.delete(instanceId);
      if (set.size === 0) this.playing.delete(request.soundId);
    }, instanceId);
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
