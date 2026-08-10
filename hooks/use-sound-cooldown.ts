"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { REALTIME_LIMITS } from "@/lib/app-config";
import { nowMs } from "@/lib/utils";

export function useSoundCooldown() {
  const [coolingIds, setCoolingIds] = useState<Record<string, boolean>>({});
  const [cooldownProgress, setCooldownProgress] = useState<
    Record<string, number>
  >({});
  const cooldownMeta = useRef<Record<string, { until: number; total: number }>>(
    {},
  );
  const cooldownTimers = useRef<Record<string, number>>({});

  useEffect(() => {
    const timers = cooldownTimers.current;
    return () => {
      for (const id of Object.keys(timers)) {
        window.clearTimeout(timers[id]);
      }
    };
  }, []);

  const activeCooldownKey = Object.keys(coolingIds).join(",");
  useEffect(() => {
    if (!activeCooldownKey) return;
    const timer = window.setInterval(() => {
      const now = nowMs();
      const progressPatch: Record<string, number> = {};
      const finished: string[] = [];

      for (const [id, meta] of Object.entries(cooldownMeta.current)) {
        const remaining = meta.until - now;
        if (remaining <= 0) {
          finished.push(id);
          delete cooldownMeta.current[id];
        } else {
          progressPatch[id] = remaining / meta.total;
        }
      }

      if (Object.keys(progressPatch).length > 0) {
        setCooldownProgress((prev) => ({ ...prev, ...progressPatch }));
      }
      if (finished.length > 0) {
        setCoolingIds((prev) => {
          const next = { ...prev };
          for (const id of finished) delete next[id];
          return next;
        });
        setCooldownProgress((prev) => {
          const next = { ...prev };
          for (const id of finished) delete next[id];
          return next;
        });
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [activeCooldownKey]);

  const isCooling = useCallback((soundId: string) => {
    const meta = cooldownMeta.current[soundId];
    return Boolean(meta && meta.until > nowMs());
  }, []);

  const startCooldown = useCallback((soundId: string, cooldownMs: number) => {
    const ms = Math.max(cooldownMs, REALTIME_LIMITS.minCooldownMs);
    setCoolingIds((prev) => ({ ...prev, [soundId]: true }));
    setCooldownProgress((prev) => ({ ...prev, [soundId]: 1 }));
    cooldownMeta.current[soundId] = {
      until: nowMs() + ms,
      total: Math.max(ms, 1),
    };
    if (cooldownTimers.current[soundId]) {
      window.clearTimeout(cooldownTimers.current[soundId]);
    }
    cooldownTimers.current[soundId] = window.setTimeout(() => {
      delete cooldownMeta.current[soundId];
      setCoolingIds((prev) => {
        const next = { ...prev };
        delete next[soundId];
        return next;
      });
      setCooldownProgress((prev) => {
        const next = { ...prev };
        delete next[soundId];
        return next;
      });
    }, ms);
  }, []);

  /** Starts cooldown only if the pad is free. Safe against rapid re-entry. */
  const tryStartCooldown = useCallback(
    (soundId: string, cooldownMs: number) => {
      if (isCooling(soundId)) return false;
      startCooldown(soundId, cooldownMs);
      return true;
    },
    [isCooling, startCooldown],
  );

  return {
    coolingIds,
    cooldownProgress,
    isCooling,
    startCooldown,
    tryStartCooldown,
  };
}
