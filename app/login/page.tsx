import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-sky-50 to-slate-200 px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">読み込み中…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
