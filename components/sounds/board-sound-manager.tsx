"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  deleteSound,
  reorderSoundsAction,
  updateSoundMeta,
} from "@/app/actions/sounds";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppError } from "@/lib/errors/catalog";
import type { PlaybackMode } from "@/types/database";

export type ManageableSound = {
  id: string;
  name: string;
  button_color: string;
  text_color: string;
  volume: number;
  cooldown_ms: number;
  category_id: string | null;
  playback_mode: PlaybackMode;
  sort_order?: number;
};

type Category = { id: string; name: string };

function SortableRow({
  sound,
  categoryName,
  onEdit,
}: {
  sound: ManageableSound;
  categoryName: string | null;
  onEdit: (sound: ManageableSound) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sound.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3"
    >
      <button
        type="button"
        className="cursor-grab rounded border px-2 py-1 text-xs text-muted-foreground active:cursor-grabbing"
        aria-label={`${sound.name}を並び替え`}
        {...attributes}
        {...listeners}
      >
        ≡
      </button>
      <div
        className="flex min-h-11 min-w-28 items-center justify-center rounded-md px-3 text-sm font-semibold"
        style={{ backgroundColor: sound.button_color, color: sound.text_color }}
      >
        {sound.name}
      </div>
      <div className="min-w-0 flex-1 text-xs text-muted-foreground">
        vol {Number(sound.volume).toFixed(2)} · cd {sound.cooldown_ms}ms
        {categoryName ? ` · ${categoryName}` : ""}
        {" · "}
        {sound.playback_mode === "toggle_loop" ? "ループ" : "ワンショット"}
      </div>
      <Button type="button" size="sm" variant="outline" onClick={() => onEdit(sound)}>
        編集
      </Button>
    </li>
  );
}

export function BoardSoundManager({
  roomId,
  initialSounds,
  categories,
}: {
  roomId: string;
  initialSounds: ManageableSound[];
  categories: Category[];
}) {
  const router = useRouter();
  const [sounds, setSounds] = useState(initialSounds);
  const [editing, setEditing] = useState<ManageableSound | null>(null);
  const [error, setError] = useState<AppError | null>(null);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const ids = useMemo(() => sounds.map((s) => s.id), [sounds]);
  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of categories) map.set(c.id, c.name);
    return map;
  }, [categories]);

  useEffect(() => {
    setSounds(initialSounds);
  }, [initialSounds]);

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sounds.findIndex((s) => s.id === active.id);
    const newIndex = sounds.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sounds, oldIndex, newIndex);
    setSounds(next);
    startTransition(async () => {
      setError(null);
      const result = await reorderSoundsAction(
        roomId,
        next.map((s) => s.id),
      );
      if (!result.ok) {
        setError({ code: result.code, message: result.error });
        setSounds(initialSounds);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/80 bg-white/90 p-4">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">
          サウンド管理
        </h2>
        <p className="text-xs font-semibold text-muted-foreground">
          ドラッグで並び替え。編集で色・音量・カテゴリ・再生モードを変更できます。
        </p>
      </div>

      {error && <ErrorAlert error={error} />}

      {sounds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
          承認済みのサウンドはまだありません。
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={ids} strategy={rectSortingStrategy}>
            <ul className="space-y-2">
              {sounds.map((sound) => (
                <SortableRow
                  key={sound.id}
                  sound={sound}
                  categoryName={
                    sound.category_id
                      ? (categoryMap.get(sound.category_id) ?? null)
                      : null
                  }
                  onEdit={setEditing}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editing && (
        <form
          className="space-y-3 rounded-xl border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              setError(null);
              const result = await updateSoundMeta(editing.id, formData);
              if (!result.ok) {
                setError({ code: result.code, message: result.error });
                return;
              }
              setEditing(null);
              router.refresh();
            });
          }}
        >
          <h3 className="font-semibold">編集: {editing.name}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="edit-name">名前</Label>
              <Input id="edit-name" name="name" defaultValue={editing.name} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-volume">音量</Label>
              <Input
                id="edit-volume"
                name="volume"
                type="number"
                min={0}
                max={1}
                step={0.05}
                defaultValue={Number(editing.volume)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-cooldown">クールダウン (ms)</Label>
              <Input
                id="edit-cooldown"
                name="cooldownMs"
                type="number"
                min={0}
                defaultValue={editing.cooldown_ms}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-category">カテゴリ</Label>
              <select
                id="edit-category"
                name="categoryId"
                defaultValue={editing.category_id ?? ""}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">未分類</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-playbackMode">再生モード</Label>
              <select
                id="edit-playbackMode"
                name="playbackMode"
                defaultValue={editing.playback_mode}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="one_shot">ワンショット</option>
                <option value="toggle_loop">トグルループ</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-buttonColor">ボタン色</Label>
              <Input
                id="edit-buttonColor"
                name="buttonColor"
                type="color"
                defaultValue={editing.button_color}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="edit-textColor">文字色</Label>
              <Input
                id="edit-textColor"
                name="textColor"
                type="color"
                defaultValue={editing.text_color}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              保存
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`「${editing.name}」を削除しますか？`)) return;
                startTransition(async () => {
                  setError(null);
                  const result = await deleteSound(editing.id);
                  if (!result.ok) {
                    setError({ code: result.code, message: result.error });
                    return;
                  }
                  setEditing(null);
                  router.refresh();
                });
              }}
            >
              削除
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
