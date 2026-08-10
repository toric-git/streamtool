import type { SupabaseClient, User } from "@supabase/supabase-js";
import { getDevAuthCredentials } from "@/lib/auth/dev-bypass";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type AppClient = SupabaseClient<Database>;

/**
 * Ensure a local dev user exists and establish a cookie session.
 * Called only when isDevAuthBypassEnabled() is true.
 */
export async function ensureDevAuthSession(
  supabase: AppClient,
): Promise<User | null> {
  const { email, password, displayName } = getDevAuthCredentials();

  const first = await supabase.auth.signInWithPassword({ email, password });
  if (first.data.user) return first.data.user;

  try {
    const admin = createAdminClient();
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { display_name: displayName },
    });

    let userId = created.data.user?.id ?? null;

    if (!userId) {
      const listed = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = listed.data.users.find((u) => u.email === email);
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, {
          password,
          email_confirm: true,
          user_metadata: { display_name: displayName },
        });
      } else if (created.error) {
        console.error("[dev-auth] createUser failed", created.error.message);
      }
    }

    if (userId) {
      const { error: profileError } = await admin.from("profiles").upsert({
        id: userId,
        display_name: displayName,
      });
      if (profileError) {
        console.error("[dev-auth] profile upsert failed", profileError.message);
      }
    }
  } catch (err) {
    console.error("[dev-auth] bootstrap failed", err);
  }

  const second = await supabase.auth.signInWithPassword({ email, password });
  if (second.error || !second.data.user) {
    console.error(
      "[dev-auth] sign-in failed",
      second.error?.message ?? "no user",
    );
    return null;
  }

  return second.data.user;
}
