import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.18),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.2),transparent_40%),linear-gradient(180deg,#fff7fb,#e8f7ff)] px-4 py-12">
      <Suspense fallback={<div className="text-sm text-muted-foreground">読み込み中…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
