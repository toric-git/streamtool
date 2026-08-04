"use client";

import type { ReactNode } from "react";

export type CategoryFilter = string | "all" | "favorites";

type Category = { id: string; name: string };

export function CategoryRail({
  categories,
  categoryId,
  onChange,
}: {
  categories: Category[];
  categoryId: CategoryFilter;
  onChange: (id: CategoryFilter) => void;
}) {
  return (
    <aside className="hidden flex-col gap-2 lg:flex">
      <p className="text-xs font-bold tracking-wide text-muted-foreground">
        カテゴリー
      </p>
      <CategoryButton
        active={categoryId === "all"}
        onClick={() => onChange("all")}
        className="rounded-xl px-3 py-2.5 text-left text-sm font-bold"
      >
        すべて
      </CategoryButton>
      <CategoryButton
        active={categoryId === "favorites"}
        onClick={() => onChange("favorites")}
        className="rounded-xl px-3 py-2.5 text-left text-sm font-bold"
        title="端末内のお気に入り（同期なし）"
      >
        お気に入り
      </CategoryButton>
      {categories.map((c) => (
        <CategoryButton
          key={c.id}
          active={categoryId === c.id}
          onClick={() => onChange(c.id)}
          className="rounded-xl px-3 py-2.5 text-left text-sm font-bold"
        >
          {c.name}
        </CategoryButton>
      ))}
    </aside>
  );
}

export function CategoryChips({
  categories,
  categoryId,
  onChange,
}: {
  categories: Category[];
  categoryId: CategoryFilter;
  onChange: (id: CategoryFilter) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto lg:hidden">
      <CategoryButton
        active={categoryId === "all"}
        onClick={() => onChange("all")}
        className="whitespace-nowrap rounded-xl border border-border bg-white/80 px-3 py-2 text-sm font-bold"
      >
        すべて
      </CategoryButton>
      <CategoryButton
        active={categoryId === "favorites"}
        onClick={() => onChange("favorites")}
        className="whitespace-nowrap rounded-xl border border-border bg-white/80 px-3 py-2 text-sm font-bold"
      >
        お気に入り
      </CategoryButton>
      {categories.map((c) => (
        <CategoryButton
          key={c.id}
          active={categoryId === c.id}
          onClick={() => onChange(c.id)}
          className="whitespace-nowrap rounded-xl border border-border bg-white/80 px-3 py-2 text-sm font-bold"
        >
          {c.name}
        </CategoryButton>
      ))}
    </div>
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
