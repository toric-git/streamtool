"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createCategory, renameCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AppError } from "@/lib/errors/catalog";

export type CategoryFilter = string | "favorites";

type Category = { id: string; name: string };

const PAD_COLORS = ["#ff6b9d", "#5eead4", "#fbbf24", "#38bdf8", "#fda4af"];

export function CategoryRail({
  roomId,
  categories,
  categoryId,
  canManage,
  onChange,
  onError,
}: {
  roomId: string;
  categories: Category[];
  categoryId: CategoryFilter;
  canManage: boolean;
  onChange: (id: CategoryFilter) => void;
  onError?: (error: AppError) => void;
}) {
  return (
    <aside className="hidden flex-col gap-2 lg:flex">
      <p className="text-xs font-bold tracking-wide text-muted-foreground">
        ぽんだしパッド
      </p>
      <PadSheetList
        roomId={roomId}
        categories={categories}
        categoryId={categoryId}
        canManage={canManage}
        onChange={onChange}
        onError={onError}
        layout="rail"
      />
    </aside>
  );
}

export function CategoryChips({
  roomId,
  categories,
  categoryId,
  canManage,
  onChange,
  onError,
}: {
  roomId: string;
  categories: Category[];
  categoryId: CategoryFilter;
  canManage: boolean;
  onChange: (id: CategoryFilter) => void;
  onError?: (error: AppError) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto lg:hidden">
      <PadSheetList
        roomId={roomId}
        categories={categories}
        categoryId={categoryId}
        canManage={canManage}
        onChange={onChange}
        onError={onError}
        layout="chips"
      />
    </div>
  );
}

function PadSheetList({
  roomId,
  categories,
  categoryId,
  canManage,
  onChange,
  onError,
  layout,
}: {
  roomId: string;
  categories: Category[];
  categoryId: CategoryFilter;
  canManage: boolean;
  onChange: (id: CategoryFilter) => void;
  onError?: (error: AppError) => void;
  layout: "rail" | "chips";
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [pending, startTransition] = useTransition();

  const chip = layout === "chips";

  function startRename(category: Category) {
    if (!canManage) return;
    setEditingId(category.id);
    setDraftName(category.name);
  }

  function commitRename(categoryIdToRename: string) {
    const next = draftName.trim();
    setEditingId(null);
    if (!next) return;
    const current = categories.find((c) => c.id === categoryIdToRename);
    if (current && current.name === next) return;

    startTransition(async () => {
      const result = await renameCategory(categoryIdToRename, next);
      if (!result.ok) {
        onError?.({ code: result.code, message: result.error });
        return;
      }
      router.refresh();
    });
  }

  function addPad() {
    const name = `パッド ${categories.length + 1}`;
    const color = PAD_COLORS[categories.length % PAD_COLORS.length];
    startTransition(async () => {
      const result = await createCategory(roomId, name, color);
      if (!result.ok) {
        onError?.({ code: result.code, message: result.error });
        return;
      }
      if (result.data?.id) {
        onChange(result.data.id);
        setEditingId(result.data.id);
        setDraftName(name);
      }
      router.refresh();
    });
  }

  return (
    <>
      <CategoryButton
        active={categoryId === "favorites"}
        onClick={() => onChange("favorites")}
        className={
          chip
            ? "whitespace-nowrap rounded-xl border border-border bg-white/80 px-3 py-2 text-sm font-bold"
            : "rounded-xl px-3 py-2.5 text-left text-sm font-bold"
        }
        title="端末内のお気に入り（他メンバーとは同期しません）"
      >
        お気に入り
      </CategoryButton>

      {categories.map((c) => {
        const active = categoryId === c.id;
        if (editingId === c.id) {
          return (
            <form
              key={c.id}
              className={chip ? "min-w-[8rem]" : "w-full"}
              onSubmit={(e) => {
                e.preventDefault();
                commitRename(c.id);
              }}
            >
              <Input
                autoFocus
                value={draftName}
                maxLength={40}
                disabled={pending}
                aria-label="パッド名"
                className="h-9 text-sm font-bold"
                onChange={(e) => setDraftName(e.target.value)}
                onBlur={() => commitRename(c.id)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setEditingId(null);
                  }
                }}
              />
            </form>
          );
        }

        return (
          <div
            key={c.id}
            className={
              chip
                ? "flex shrink-0 items-center gap-1"
                : "flex items-center gap-1"
            }
          >
            <CategoryButton
              active={active}
              onClick={() => onChange(c.id)}
              className={
                chip
                  ? "whitespace-nowrap rounded-xl border border-border bg-white/80 px-3 py-2 text-sm font-bold"
                  : "min-w-0 flex-1 rounded-xl px-3 py-2.5 text-left text-sm font-bold"
              }
            >
              <span className="truncate">{c.name}</span>
            </CategoryButton>
            {canManage && (
              <button
                type="button"
                className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={`${c.name}の名前を変更`}
                title="名前を変更"
                disabled={pending}
                onClick={() => startRename(c)}
              >
                改名
              </button>
            )}
          </div>
        );
      })}

      {canManage && (
        <Button
          type="button"
          size="sm"
          variant={chip ? "outline" : "secondary"}
          disabled={pending}
          className={
            chip
              ? "shrink-0 rounded-xl border-dashed"
              : "justify-start rounded-xl border border-dashed"
          }
          onClick={addPad}
        >
          ＋ パッド追加
        </Button>
      )}
    </>
  );
}

function CategoryButton({
  active,
  onClick,
  className,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  className: string;
  title?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      className={`${className} ${
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-secondary"
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
