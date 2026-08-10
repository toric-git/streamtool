"use client";

import { useTransition } from "react";
import { setFeedbackStatus } from "@/app/actions/feedback";
import { Button } from "@/components/ui/button";

export function FeedbackStatusButton({
  id,
  status,
}: {
  id: string;
  status: "open" | "done";
}) {
  const [pending, startTransition] = useTransition();
  const next = status === "open" ? "done" : "open";

  return (
    <Button
      type="button"
      size="sm"
      variant={status === "open" ? "default" : "outline"}
      className="font-bold shadow-none"
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await setFeedbackStatus(id, next);
        });
      }}
    >
      {pending
        ? "更新中…"
        : status === "open"
          ? "対応済みにする"
          : "未対応に戻す"}
    </Button>
  );
}
