import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Alert({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
}) {
  return (
    <div
      role="alert"
      className={cn(
        "relative w-full rounded-lg border px-4 py-3 text-sm",
        variant === "destructive"
          ? "border-destructive/50 text-destructive bg-destructive/5"
          : "bg-muted/40 text-foreground",
        className,
      )}
      {...props}
    />
  );
}
