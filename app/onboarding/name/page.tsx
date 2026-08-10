import { redirect } from "next/navigation";
import { DisplayNameForm } from "@/components/auth/display-name-form";
import { needsDisplayNameSetup } from "@/lib/auth/display-name";
import { createClient } from "@/lib/supabase/server";

type Props = { searchParams: Promise<{ next?: string }> };

export default async function OnboardingNamePage({ searchParams }: Props) {
  const { next: nextParam } = await searchParams;
  const next =
    nextParam && nextParam.startsWith("/") ? nextParam : "/dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/onboarding/name?next=${next}`)}`);
  }

  if (!needsDisplayNameSetup(user)) {
    redirect(next);
  }

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-[radial-gradient(ellipse_at_top,rgba(255,77,141,0.18),transparent_45%),radial-gradient(ellipse_at_bottom,rgba(56,189,248,0.2),transparent_40%),linear-gradient(180deg,#fff7fb,#e8f7ff)] px-4 py-12">
      <DisplayNameForm next={next} />
    </main>
  );
}
