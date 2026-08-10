"use client";

import { useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createCategory, renameCategory } from "@/app/actions/categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CUTE_BUTTON_COLORS } from "@/lib/sounds/button-colors";
import type { AppError } from "@/lib/errors/catalog";

export type CategoryFilter = string | "favorites";

type Category = { id: string; name: string; sort_order?: number };

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function nextDefaultPadName(categories: Category[]) {
  const base = "ぽんだし";
  if (!categories.some((c) => c.name === base)) return base;
  let n = 2;
  while (categories.some((c) => c.name === `${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

export function CategoryRail({
  roomId,
  categories,
  categoryId,
  canManage,
  onChange,
  onCategoryCreated,
  onError,
}: {
  roomId: string;
  categories: Category[];
  categoryId: CategoryFilter;
  canManage: boolean;
  onChange: (id: CategoryFilter) => void;
  onCategoryCreated?: (category: Category) => void;
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
        onCategoryCreated={onCategoryCreated}
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
  onCategoryCreated,
  onError,
}: {
  roomId: string;
  categories: Category[];
  categoryId: CategoryFilter;
  canManage: boolean;
  onChange: (id: CategoryFilter) => void;
  onCategoryCreated?: (category: Category) => void;
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
        onCategoryCreated={onCategoryCreated}
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
  onCategoryCreated,
  onError,
  layout,
}: {
  roomId: string;
  categories: Category[];
  categoryId: CategoryFilter;
  canManage: boolean;
  onChange: (id: CategoryFilter) => void;
  onCategoryCreated?: (category: Category) => void;
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
    const name = nextDefaultPadName(categories);
    const color =
      CUTE_BUTTON_COLORS[categories.length % CUTE_BUTTON_COLORS.length]!.hex;
    const sortOrder =
      categories.reduce((max, c) => Math.max(max, c.sort_order ?? 0), -1) + 1;

    startTransition(async () => {
      const result = await createCategory(roomId, name, color);
      if (!result.ok) {
        onError?.({ code: result.code, message: result.error });
        return;
      }
      if (result.data?.id) {
        const created = {
          id: result.data.id,
          name,
          sort_order: sortOrder,
        };
        onCategoryCreated?.(created);
        onChange(created.id);
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
        title="あなたのお気に入り（アカウント同期・他端末でも同じ）"
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
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={`${c.name}の名前を変更`}
                title="名前を変更"
                disabled={pending}
                onClick={() => startRename(c)}
              >
                <PencilIcon className="size-3.5" />
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
