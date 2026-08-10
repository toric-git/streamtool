"use client";

import { useState } from "react";
import { APP_URL } from "@/lib/app-config";
import { buildInviteUrl } from "@/lib/rooms/codes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Inline invite controls for the board participants column. */
export function InvitePanel({ roomCode }: { roomCode: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState<"code" | "url" | null>(null);
  const inviteUrl = buildInviteUrl(APP_URL, roomCode);

  async function copy(text: string, kind: "code" | "url") {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--hub-coral)]/25 bg-[linear-gradient(180deg,#fff7fb,#ffffff)] p-3">
      <div>
        <p className="font-display text-sm font-semibold tracking-tight">招待</p>
        <p className="text-xs font-semibold text-muted-foreground">
          コードやURLはクリックして表示できます
        </p>
      </div>

      {!revealed ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="w-full"
          onClick={() => setRevealed(true)}
        >
          招待コードを表示
        </Button>
      ) : (
        <>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="board-room-code" className="text-xs font-bold">
                ルームコード
              </Label>
              <button
                type="button"
                className="text-[11px] font-bold text-muted-foreground hover:text-foreground"
                onClick={() => setRevealed(false)}
              >
                隠す
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                id="board-room-code"
                readOnly
                value={roomCode}
                className="font-mono text-sm font-bold"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void copy(roomCode, "code")}
              >
                {copied === "code" ? "OK" : "コピー"}
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="board-invite-url" className="text-xs font-bold">
              招待URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="board-invite-url"
                readOnly
                value={inviteUrl}
                className="text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void copy(inviteUrl, "url")}
              >
                {copied === "url" ? "OK" : "コピー"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
