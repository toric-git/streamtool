"use client";

import { useState, useTransition } from "react";
import { issueObsToken } from "@/app/actions/obs";
import { createClient } from "@/lib/supabase/client";
import { randomUUID } from "@/lib/crypto/random-uuid";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TokenMeta = {
  id: string;
  token_hint: string | null;
  enabled: boolean;
  created_at: string;
  last_used_at: string | null;
};

export function ObsSetupDialog({
  roomId,
  tokens,
}: {
  roomId: string;
  tokens: TokenMeta[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [issued, setIssued] = useState<{ url: string; plainToken: string } | null>(
    null,
  );
  const [pending, startTransition] = useTransition();
  const [testMessage, setTestMessage] = useState<string | null>(null);

  return (
    <section className="space-y-4 rounded-xl border p-4">
      <div>
        <h2 className="text-lg font-semibold">OBS 連携</h2>
        <p className="text-sm text-muted-foreground">
          トークンは発行時に一度だけ表示されます。漏えいしたら再発行してください。
        </p>
      </div>

      {error && <Alert variant="destructive">{error}</Alert>}
      {testMessage && <Alert>{testMessage}</Alert>}

      {issued && (
        <div className="space-y-2 rounded-lg border border-teal-200 bg-teal-50 p-3">
          <p className="text-sm font-medium text-teal-900">
            この URL を OBS のブラウザソースに貼り付けてください（再表示できません）
          </p>
          <Label htmlFor="obsUrl">OBS URL</Label>
          <Input id="obsUrl" readOnly value={issued.url} />
          <Button
            type="button"
            variant="secondary"
            onClick={() => void navigator.clipboard.writeText(issued.url)}
          >
            URLをコピー
          </Button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              tokens.some((t) => t.enabled) &&
              !window.confirm("既存の有効トークンを無効化して再発行しますか？")
            ) {
              return;
            }
            setError(null);
            startTransition(async () => {
              const result = await issueObsToken(roomId);
              if (!result.ok || !result.data) {
                setError(result.ok ? "発行結果が不正です。" : result.error);
                return;
              }
              setIssued({
                url: result.data.url,
                plainToken: result.data.plainToken,
              });
            });
          }}
        >
          {pending ? "発行中…" : "OBSトークンを発行 / 再発行"}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            startTransition(async () => {
              setTestMessage(null);
              setError(null);
              const supabase = createClient();
              const { data: sounds } = await supabase
                .from("sounds")
                .select("id")
                .eq("room_id", roomId)
                .eq("approval_status", "approved")
                .eq("is_active", true)
                .limit(1);
              const soundId = sounds?.[0]?.id;
              if (!soundId) {
                setError("テスト再生する承認済みサウンドがありません。");
                return;
              }
              const { error: playError } = await supabase.rpc("create_playback_event", {
                p_room_id: roomId,
                p_sound_id: soundId,
                p_action: "play",
                p_volume: 1,
                p_client_event_id: randomUUID(),
              });
              if (playError) {
                setError("テスト再生の送信に失敗しました。");
                return;
              }
              setTestMessage("テスト再生イベントを送信しました。OBSでも鳴るか確認してください。");
            });
          }}
        >
          OBSテスト再生
        </Button>
      </div>

      <ul className="space-y-2 text-sm">
        {tokens.length === 0 ? (
          <li className="text-muted-foreground">まだトークンがありません。</li>
        ) : (
          tokens.map((t) => (
            <li key={t.id} className="rounded border px-3 py-2">
              hint …{t.token_hint} · {t.enabled ? "有効" : "無効"} ·{" "}
              {new Date(t.created_at).toLocaleString("ja-JP")}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
