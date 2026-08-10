"use client";

import { useState, useTransition } from "react";
import { createSound } from "@/app/actions/sounds";
import { readAudioDurationMs, previewAudioFile } from "@/lib/audio/browser-meta";
import { validateAudioFileMeta, validateImageFileMeta } from "@/lib/validation/schemas";
import { Alert } from "@/components/ui/alert";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { E, type AppError, withMessage } from "@/lib/errors/catalog";

type Category = { id: string; name: string };

export function SoundUploadForm({
  roomId,
  categories,
  canUpload,
  compact = false,
  onSuccess,
}: {
  roomId: string;
  categories: Category[];
  canUpload: boolean;
  compact?: boolean;
  onSuccess?: () => void;
}) {
  const [error, setError] = useState<AppError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [durationMs, setDurationMs] = useState<number | null>(null);
  const audioInputId = compact ? "board-audio" : "audio";
  const nameInputId = compact ? "board-sound-name" : "name";

  if (!canUpload) {
    return <ErrorAlert error={E.SOUND_UPLOAD_DISABLED} />;
  }

  return (
    <form
      className={
        compact
          ? "space-y-3 rounded-xl border border-[var(--hub-coral)]/30 bg-[linear-gradient(180deg,#fff7fb,#ffffff)] p-3"
          : "space-y-4 rounded-xl border bg-card p-4"
      }
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(form);
        const audio = formData.get("audio");
        const image = formData.get("image");

        setError(null);
        setSuccess(null);

        startTransition(async () => {
          if (!(audio instanceof File) || audio.size === 0) {
            setError(E.SOUND_FILE_REQUIRED);
            return;
          }

          let duration = durationMs;
          try {
            duration = duration ?? (await readAudioDurationMs(audio));
          } catch {
            setError(E.SOUND_DURATION_READ);
            return;
          }

          const audioCheck = validateAudioFileMeta({
            filename: audio.name,
            mimeType: audio.type || "application/octet-stream",
            sizeBytes: audio.size,
            durationMs: duration,
          });
          if (!audioCheck.ok) {
            setError(withMessage(E.VALIDATION, audioCheck.message));
            return;
          }

          let imagePath: string | null = null;
          if (image instanceof File && image.size > 0) {
            const imageCheck = validateImageFileMeta({
              filename: image.name,
              mimeType: image.type || "application/octet-stream",
              sizeBytes: image.size,
            });
            if (!imageCheck.ok) {
              setError(withMessage(E.VALIDATION, imageCheck.message));
              return;
            }

            const imageUpload = await requestUploadUrl({
              roomId,
              kind: "image",
              file: image,
            });
            if (!imageUpload.ok) {
              setError(imageUpload.error);
              return;
            }
            const uploaded = await uploadWithToken(imageUpload, image);
            if (!uploaded.ok) {
              setError(uploaded.error);
              return;
            }
            imagePath = imageUpload.path;
          }

          const audioUpload = await requestUploadUrl({
            roomId,
            kind: "audio",
            file: audio,
            durationMs: duration,
          });
          if (!audioUpload.ok) {
            setError(audioUpload.error);
            return;
          }
          const uploadedAudio = await uploadWithToken(audioUpload, audio);
          if (!uploadedAudio.ok) {
            setError(uploadedAudio.error);
            return;
          }

          const result = await createSound({
            roomId,
            name: String(formData.get("name") || ""),
            audioPath: audioUpload.path,
            imagePath,
            categoryId: String(formData.get("categoryId") || "") || null,
            buttonColor: String(formData.get("buttonColor") || "#334155"),
            textColor: String(formData.get("textColor") || "#ffffff"),
            volume: Number(formData.get("volume") || 1),
            cooldownMs: Number(formData.get("cooldownMs") || 1000),
            durationMs: duration,
          });

          if (!result.ok) {
            setError({ code: result.code, message: result.error });
            return;
          }

          setSuccess(
            compact
              ? "追加しました。パッドに反映されます。"
              : "サウンドを登録しました。承認が必要な場合は、承認されるまでボードに表示されません。",
          );
          form.reset();
          setDurationMs(null);
          onSuccess?.();
        });
      }}
    >
      {!compact && <h2 className="text-lg font-semibold">サウンドを追加</h2>}
      {compact && (
        <p className="text-sm font-bold">新しいパッドを追加</p>
      )}
      {error && <ErrorAlert error={error} />}
      {success && <Alert>{success}</Alert>}

      <div className="space-y-2">
        <Label htmlFor={audioInputId}>
          音声ファイル (MP3/WAV/OGG, 10MB・30秒以下)
        </Label>
        <Input
          id={audioInputId}
          name="audio"
          type="file"
          accept=".mp3,.wav,.ogg,audio/mpeg,audio/wav,audio/ogg"
          required
          onChange={async (e) => {
            const file = e.target.files?.[0];
            setDurationMs(null);
            if (!file) return;
            try {
              const ms = await readAudioDurationMs(file);
              setDurationMs(ms);
            } catch {
              setError(E.SOUND_META_READ);
            }
          }}
        />
        {durationMs != null && (
          <p className="text-xs text-muted-foreground">
            再生時間: {(durationMs / 1000).toFixed(2)} 秒
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor={nameInputId}>ボタン名</Label>
        <Input id={nameInputId} name="name" required maxLength={40} />
      </div>

      <div className={`grid gap-3 ${compact ? "grid-cols-2" : "sm:grid-cols-2"}`}>
        <div className="space-y-2">
          <Label htmlFor={`${audioInputId}-buttonColor`}>ボタン色</Label>
          <Input
            id={`${audioInputId}-buttonColor`}
            name="buttonColor"
            type="color"
            defaultValue="#ff4d8d"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${audioInputId}-textColor`}>文字色</Label>
          <Input
            id={`${audioInputId}-textColor`}
            name="textColor"
            type="color"
            defaultValue="#ffffff"
          />
        </div>
        {!compact && (
          <>
            <div className="space-y-2">
              <Label htmlFor="volume">音量 (0-1)</Label>
              <Input
                id="volume"
                name="volume"
                type="number"
                min={0}
                max={1}
                step={0.05}
                defaultValue={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cooldownMs">クールダウン (ms)</Label>
              <Input
                id="cooldownMs"
                name="cooldownMs"
                type="number"
                min={0}
                defaultValue={1000}
              />
            </div>
          </>
        )}
      </div>

      {compact && (
        <>
          <input type="hidden" name="volume" value="1" />
          <input type="hidden" name="cooldownMs" value="1000" />
        </>
      )}

      {!compact && (
        <>
          <div className="space-y-2">
            <Label htmlFor="categoryId">カテゴリー</Label>
            <select
              id="categoryId"
              name="categoryId"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              defaultValue=""
            >
              <option value="">なし</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">背景画像（任意）</Label>
            <Input
              id="image"
              name="image"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/*"
            />
          </div>
        </>
      )}

      {compact && categories.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="board-categoryId">カテゴリー（任意）</Label>
          <select
            id="board-categoryId"
            name="categoryId"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            defaultValue=""
          >
            <option value="">なし</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "アップロード中…" : compact ? "パッドに追加" : "登録"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            const input = document.getElementById(
              audioInputId,
            ) as HTMLInputElement | null;
            const file = input?.files?.[0];
            if (!file) {
              setError(E.SOUND_PREVIEW_REQUIRED);
              return;
            }
            try {
              await previewAudioFile(file);
            } catch {
              setError(E.SOUND_PREVIEW_FAILED);
            }
          }}
        >
          試聴
        </Button>
      </div>
    </form>
  );
}

async function requestUploadUrl(options: {
  roomId: string;
  kind: "audio" | "image";
  file: File;
  durationMs?: number;
}): Promise<
  | { ok: true; path: string; token: string; signedUrl: string; bucket: string }
  | { ok: false; error: AppError }
> {
  const res = await fetch("/api/media/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomId: options.roomId,
      kind: options.kind,
      filename: options.file.name,
      mimeType: options.file.type || "application/octet-stream",
      sizeBytes: options.file.size,
      durationMs: options.durationMs,
    }),
  });
  const data = (await res.json()) as {
    error?: string;
    code?: string;
    path?: string;
    token?: string;
    signedUrl?: string;
    bucket?: string;
  };
  if (!res.ok || !data.path || !data.token || !data.signedUrl || !data.bucket) {
    return {
      ok: false,
      error: {
        code: (data.code as AppError["code"]) ?? E.MEDIA_UPLOAD_URL_FAILED.code,
        message: data.error ?? E.MEDIA_UPLOAD_URL_FAILED.message,
      },
    };
  }
  return {
    ok: true,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
    bucket: data.bucket,
  };
}

async function uploadWithToken(
  upload: { path: string; token: string; signedUrl: string; bucket: string },
  file: File,
): Promise<{ ok: true } | { ok: false; error: AppError }> {
  const { createClient } = await import("@/lib/supabase/client");
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(upload.bucket)
    .uploadToSignedUrl(upload.path, upload.token, file, {
      contentType: file.type || undefined,
      upsert: false,
    });

  if (error) {
    console.error("[upload]", E.MEDIA_UPLOAD_FAILED.code, error.name);
    return {
      ok: false,
      error: withMessage(
        E.MEDIA_UPLOAD_FAILED,
        "ファイルのアップロードに失敗しました。容量と形式を確認して再試行してください。",
      ),
    };
  }
  return { ok: true };
}
