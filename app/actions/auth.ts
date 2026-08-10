"use server";

import { redirect } from "next/navigation";
import { E, type ErrorCode } from "@/lib/errors/catalog";
import { mapAuthError } from "@/lib/errors/messages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation/schemas";

export type AuthActionState = {
  error: string | null;
  code: ErrorCode | null;
  success?: string | null;
};

export async function signInWithEmail(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? E.VALIDATION.message,
      code: E.VALIDATION.code,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    const mapped = mapAuthError(
      `${error.name} ${error.message} ${error.code ?? ""}`,
    );
    console.error(
      "[auth]",
      mapped.code,
      error.name,
      error.message,
      error.code,
    );
    return { error: mapped.message, code: mapped.code };
  }

  const next = String(formData.get("next") || "/dashboard");
  redirect(next.startsWith("/") ? next : "/dashboard");
}

export async function signUpWithEmail(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? E.VALIDATION.message,
      code: E.VALIDATION.code,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
    },
  });

  if (error) {
    const mapped = mapAuthError(
      `${error.name} ${error.message} ${error.code ?? ""}`,
    );
    console.error(
      "[auth]",
      mapped.code,
      error.name,
      error.message,
      error.code,
    );
    return { error: mapped.message, code: mapped.code };
  }

  if (data.user) {
    try {
      const admin = createAdminClient();
      await admin.from("profiles").upsert({
        id: data.user.id,
        display_name: parsed.data.displayName,
      });
    } catch (err) {
      console.error("[auth] profile upsert after signup", err);
    }
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    error: null,
    code: null,
    success:
      "確認メールを送信しました。メール内のリンクを開いてからログインしてください。",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
