"use client";

import { useState } from "react";
import { APP_URL } from "@/lib/app-config";
import { buildInviteUrl } from "@/lib/rooms/codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InviteDialog({ roomCode }: { roomCode: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inviteUrl = buildInviteUrl(APP_URL, roomCode);

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="outline" onClick={() => setOpen((v) => !v)}>
        招待
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="招待"
          className="absolute right-4 top-16 z-20 w-[min(100vw-2rem,24rem)] rounded-xl border bg-card p-4 shadow-lg"
        >
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="roomCode">ルームコード</Label>
              <div className="flex gap-2">
                <Input id="roomCode" readOnly value={roomCode} />
                <Button type="button" variant="secondary" onClick={() => copy(roomCode)}>
                  コピー
                </Button>
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="inviteUrl">招待URL</Label>
              <div className="flex gap-2">
                <Input id="inviteUrl" readOnly value={inviteUrl} />
                <Button type="button" variant="secondary" onClick={() => copy(inviteUrl)}>
                  コピー
                </Button>
              </div>
            </div>
            {copied && <p className="text-xs text-teal-700">コピーしました</p>}
            <Button type="button" variant="ghost" className="w-full" onClick={() => setOpen(false)}>
              閉じる
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
