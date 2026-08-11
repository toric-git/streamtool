"use client";

import { useEffect, useId, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ObsUsageGuide } from "@/components/rooms/obs-usage-guide";
import { RoomSettingsForm } from "@/components/rooms/room-settings-form";
import { Button } from "@/components/ui/button";
import type { RoomRole, Tables } from "@/types/database";

export type RoomSettingsPayload = {
  room: Pick<
    Tables<"rooms">,
    | "id"
    | "name"
    | "description"
    | "guest_enabled"
    | "guest_can_play"
    | "upload_enabled"
    | "upload_requires_approval"
    | "master_volume"
    | "default_cooldown_ms"
    | "max_events_per_minute"
    | "max_simultaneous_sounds"
    | "max_members"
  > & { has_password: boolean };
  role: RoomRole;
  paidCapacity: boolean;
};

export function RoomSettingsPanel({
  payload,
  defaultOpen = false,
}: {
  payload: RoomSettingsPayload;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(() => defaultOpen || false);
  const titleId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const settingsQueryOpen = searchParams.get("settings") === "1";
  const [sawSettingsQuery, setSawSettingsQuery] = useState(settingsQueryOpen);

  if (settingsQueryOpen !== sawSettingsQuery) {
    setSawSettingsQuery(settingsQueryOpen);
    if (settingsQueryOpen) {
      setOpen(true);
    }
  }

  function close() {
    setOpen(false);
    if (searchParams.get("settings") === "1") {
      router.replace(pathname);
    }
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        if (searchParams.get("settings") === "1") {
          router.replace(pathname);
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pathname, searchParams, router]);

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        オーナー設定
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center sm:p-6"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b px-4 py-3">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold tracking-tight"
                >
                  オーナー設定
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  閉じるとボードに戻ります（部屋からは出ません）
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={close}>
                ボードに戻る
              </Button>
            </div>
            <div className="grid gap-6 overflow-y-auto px-4 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
              <RoomSettingsForm
                room={payload.room}
                role={payload.role}
                paidCapacity={payload.paidCapacity}
              />
              <ObsUsageGuide />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
