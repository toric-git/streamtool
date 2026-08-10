"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { submitFeedback } from "@/app/actions/feedback";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorAlert } from "@/components/ui/error-alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AppError } from "@/lib/errors/catalog";
import { cn } from "@/lib/utils";

type Category = "request" | "bug";

export function FeedbackButton({
  className,
  variant = "outline",
  size = "sm",
}: {
  className?: string;
  variant?: "outline" | "ghost" | "secondary";
  size?: "sm" | "default";
}) {
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<Category>("request");
  const [message, setMessage] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<AppError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  function resetForm() {
    setCategory("request");
    setMessage("");
    setContactName("");
    setContactEmail("");
    setError(null);
    setSuccess(null);
  }

  function close() {
    setOpen(false);
    resetForm();
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await submitFeedback({
        category,
        message,
        contactName,
        contactEmail,
        pageUrl:
          typeof window !== "undefined" ? window.location.href.slice(0, 500) : "",
      });
      if (!result.ok) {
        setError({ code: result.code, message: result.error });
        return;
      }
      setSuccess("送信しました。ご協力ありがとうございます。");
      setMessage("");
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn("font-bold", className)}
        onClick={() => {
          resetForm();
          setOpen(true);
        }}
      >
        ご要望・バグ報告
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="presentation"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2
                  id={titleId}
                  className="font-display text-lg font-semibold tracking-tight"
                >
                  ご要望・バグ報告
                </h2>
                <p className="text-xs font-semibold text-muted-foreground">
                  改善のヒントや不具合を教えてください（ログイン不要）
                </p>
              </div>
              <Button type="button" size="sm" variant="secondary" onClick={close}>
                閉じる
              </Button>
            </div>

            {error && <ErrorAlert error={error} className="mb-3" />}
            {success && <Alert className="mb-3">{success}</Alert>}

            <form className="space-y-4" onSubmit={onSubmit}>
              <fieldset className="space-y-2">
                <legend className="text-sm font-bold">種類</legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { value: "request", label: "ご要望" },
                      { value: "bug", label: "バグ報告" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={category === opt.value}
                      onClick={() => setCategory(opt.value)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-bold transition",
                        category === opt.value
                          ? "border-[var(--hub-coral)] bg-[linear-gradient(160deg,#fff7fb,#ffffff)] text-foreground"
                          : "border-border bg-white text-muted-foreground hover:border-foreground/30",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="feedback-message">内容（必須）</Label>
                <textarea
                  id="feedback-message"
                  required
                  rows={6}
                  maxLength={4000}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    category === "bug"
                      ? "いつ・どこで・何が起きたかを書いてください"
                      : "欲しい機能や使いづらい点を書いてください"
                  }
                  className="flex min-h-[8rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="feedback-name">お名前（任意）</Label>
                  <Input
                    id="feedback-name"
                    value={contactName}
                    maxLength={80}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="ニックネーム可"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="feedback-email">連絡先メール（任意）</Label>
                  <Input
                    id="feedback-email"
                    type="email"
                    value={contactEmail}
                    maxLength={254}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="返信が必要な場合"
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-2 pt-1">
                <Button type="button" variant="ghost" onClick={close}>
                  キャンセル
                </Button>
                <Button type="submit" disabled={pending || !message.trim()}>
                  {pending ? "送信中…" : "送信する"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
