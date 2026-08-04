"use client";

import { useMemo, useState, useTransition } from "react";
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
import { deleteSound, reorderSoundsAction, updateSoundMeta } from "@/app/actions/sounds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Tables } from "@/types/database";

type Sound = Tables<"sounds">;

function SortableRow({
  sound,
  canManage,
  onEdit,
}: {
  sound: Sound;
  canManage: boolean;
  onEdit: (sound: Sound) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sound.id, disabled: !canManage });

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
      {canManage && (
        <button
          type="button"
          className="cursor-grab rounded border px-2 py-1 text-xs text-muted-foreground active:cursor-grabbing"
          aria-label={`${sound.name}を並び替え`}
          {...attributes}
          {...listeners}
        >
          ≡
        </button>
      )}
      <div
        className="flex min-h-11 min-w-28 items-center justify-center rounded-md px-3 text-sm font-semibold"
        style={{ backgroundColor: sound.button_color, color: sound.text_color }}
      >
        {sound.name}
      </div>
      <div className="min-w-0 flex-1 text-xs text-muted-foreground">
        vol {Number(sound.volume).toFixed(2)} · cd {sound.cooldown_ms}ms ·{" "}
        {sound.approval_status}
        {!sound.is_active ? " · inactive" : ""}
      </div>
      {canManage && (
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onEdit(sound)}>
            編集
          </Button>
        </div>
      )}
    </li>
  );
}

export function SoundManageList({
  roomId,
  initialSounds,
  canManage,
}: {
  roomId: string;
  initialSounds: Sound[];
  canManage: boolean;
}) {
  const [sounds, setSounds] = useState(initialSounds);
  const [editing, setEditing] = useState<Sound | null>(null);
  const [pending, startTransition] = useTransition();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const ids = useMemo(() => sounds.map((s) => s.id), [sounds]);

  function onDragEnd(event: DragEndEvent) {
    if (!canManage) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sounds.findIndex((s) => s.id === active.id);
    const newIndex = sounds.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = arrayMove(sounds, oldIndex, newIndex);
    setSounds(next);
    startTransition(async () => {
      await reorderSoundsAction(
        roomId,
        next.map((s) => s.id),
      );
    });
  }

  return (
    <div className="space-y-4">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={ids} strategy={rectSortingStrategy}>
          <ul className="space-y-2">
            {sounds.map((sound) => (
              <SortableRow
                key={sound.id}
                sound={sound}
                canManage={canManage}
                onEdit={setEditing}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      {editing && (
        <form
          className="space-y-3 rounded-xl border p-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const result = await updateSoundMeta(editing.id, formData);
              if (result.ok) {
                setSounds((prev) =>
                  prev.map((s) =>
                    s.id === editing.id
                      ? {
                          ...s,
                          name: String(formData.get("name")),
                          button_color: String(formData.get("buttonColor")),
                          text_color: String(formData.get("textColor")),
                          volume: Number(formData.get("volume")),
                          cooldown_ms: Number(formData.get("cooldownMs")),
                        }
                      : s,
                  ),
                );
                setEditing(null);
              }
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
              <Label htmlFor="edit-cooldown">クールダウン</Label>
              <Input
                id="edit-cooldown"
                name="cooldownMs"
                type="number"
                defaultValue={editing.cooldown_ms}
              />
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
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              キャンセル
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (!window.confirm(`「${editing.name}」を削除しますか？`)) return;
                startTransition(async () => {
                  const result = await deleteSound(editing.id);
                  if (result.ok) {
                    setSounds((prev) => prev.filter((s) => s.id !== editing.id));
                    setEditing(null);
                  }
                });
              }}
            >
              削除
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
