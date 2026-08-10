"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import { PLACEHOLDER_DISPLAY_NAME } from "@/lib/auth/display-name";
import { E, withMessage } from "@/lib/errors/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { displayNameSchema } from "@/lib/validation/schemas";

export async function updateDisplayNameAction(
  formData: FormData,
): Promise<ActionResult> {
  const parsed = displayNameSchema.safeParse(formData.get("displayName"));
  if (!parsed.success) {
    return actionFail(
      withMessage(
        E.VALIDATION,
        parsed.error.issues[0]?.message ?? E.VALIDATION.message,
      ),
    );
  }

  const displayName = parsed.data;
  if (displayName === PLACEHOLDER_DISPLAY_NAME) {
    return actionFail(
      withMessage(E.VALIDATION, "別の表示名を入力してください。"),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return actionFail(E.AUTH_REQUIRED);

  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });
  if (authError) {
    console.error(
      "[profile]",
      E.PROFILE_NAME_UPDATE_FAILED.code,
      authError.name,
      authError.message,
    );
    return actionFail(E.PROFILE_NAME_UPDATE_FAILED);
  }

  try {
    const admin = createAdminClient();
    const { error: profileError } = await admin.from("profiles").upsert({
      id: user.id,
      display_name: displayName,
    });
    if (profileError) {
      console.error(
        "[profile]",
        E.PROFILE_NAME_UPDATE_FAILED.code,
        profileError.code,
        profileError.message,
      );
      return actionFail(E.PROFILE_NAME_UPDATE_FAILED);
    }

    // Keep room participant lists in sync for all members.
    const { error: memberError } = await admin
      .from("room_members")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    if (memberError) {
      console.error(
        "[profile]",
        E.PROFILE_NAME_UPDATE_FAILED.code,
        memberError.code,
        memberError.message,
      );
      return actionFail(E.PROFILE_NAME_UPDATE_FAILED);
    }
  } catch (err) {
    console.error("[profile]", E.PROFILE_NAME_UPDATE_FAILED.code, err);
    return actionFail(E.PROFILE_NAME_UPDATE_FAILED);
  }

  revalidatePath("/dashboard");
  revalidatePath("/onboarding/name");
  revalidatePath("/rooms", "layout");

  const nextRaw = String(formData.get("next") ?? "").trim();
  if (nextRaw.startsWith("/")) {
    redirect(nextRaw);
  }

  return actionOk();
}
