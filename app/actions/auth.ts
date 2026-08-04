"use server";

import { redirect } from "next/navigation";
import { mapAuthError } from "@/lib/errors/messages";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, signupSchema } from "@/lib/validation/schemas";

export type AuthActionState = {
  error: string | null;
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
    return { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error(
      "[auth] signInWithEmail failed",
      error.name,
      error.message,
    );
    return { error: mapAuthError(`${error.name} ${error.message}`) };
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
    return { error: parsed.error.issues[0]?.message ?? "入力内容が正しくありません" };
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
    console.error(
      "[auth] signUpWithEmail failed",
      error.name,
      error.message,
    );
    return { error: mapAuthError(`${error.name} ${error.message}`) };
  }

  if (data.session) {
    redirect("/dashboard");
  }

  return {
    error: null,
    success:
      "確認メールを送信しました。メール内のリンクを開いてからログインしてください。",
  };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
