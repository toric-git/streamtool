"use client";

import { useState } from "react";
import { InvitePanel } from "@/components/rooms/invite-panel";
import { Button } from "@/components/ui/button";

/** Legacy toggle wrapper. Prefer InvitePanel on the room board. */
export function InviteDialog({ roomCode }: { roomCode: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
        招待
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="招待"
          className="absolute right-0 top-12 z-20 w-[min(100vw-2rem,24rem)] rounded-xl border bg-card p-2 shadow-lg"
        >
          <InvitePanel roomCode={roomCode} />
          <Button
            type="button"
            variant="ghost"
            className="mt-2 w-full"
            onClick={() => setOpen(false)}
          >
            閉じる
          </Button>
        </div>
      )}
    </div>
  );
}
