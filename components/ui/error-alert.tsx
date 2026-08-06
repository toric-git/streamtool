import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import {
  formatErrorCodeLine,
  type AppError,
  type ErrorCode,
} from "@/lib/errors/catalog";
import { cn } from "@/lib/utils";

type Props = {
  code?: ErrorCode | string | null;
  message?: string | null;
  error?: AppError | null;
  children?: ReactNode;
  className?: string;
};

export function ErrorAlert({
  code,
  message,
  error,
  children,
  className,
}: Props) {
  const resolvedCode = error?.code ?? code ?? null;
  const resolvedMessage = error?.message ?? message ?? null;

  return (
    <Alert variant="destructive" className={cn(className)}>
      {resolvedMessage ? <p>{resolvedMessage}</p> : children}
      {resolvedCode ? (
        <p className="mt-1.5 font-mono text-xs tracking-wide opacity-80">
          {formatErrorCodeLine(resolvedCode as ErrorCode)}
          <span className="ml-1 font-sans opacity-70">
            （お問い合わせ時にお知らせください）
          </span>
        </p>
      ) : null}
    </Alert>
  );
}
