"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import {
  actionFail,
  actionOk,
  type ActionResult,
} from "@/lib/actions/result";
import {
  clientIpFromHeaders,
  FEEDBACK_LIMITS,
  feedbackClientKey,
  requireAppAdmin,
} from "@/lib/auth/app-admin";
import { E, withMessage } from "@/lib/errors/catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const feedbackSchema = z.object({
  category: z.enum(["request", "bug"]),
  message: z.string().trim().min(1).max(4000),
  contactEmail: z.string().trim().max(254).optional().default(""),
  contactName: z.string().trim().max(80).optional().default(""),
  pageUrl: z.string().trim().max(500).optional().default(""),
});

export async function submitFeedback(input: {
  category: "request" | "bug";
  message: string;
  contactEmail?: string;
  contactName?: string;
  pageUrl?: string;
}): Promise<ActionResult> {
  const parsed = feedbackSchema.safeParse(input);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    if (issue?.path.includes("message") && issue.code === "too_small") {
      return actionFail(E.FEEDBACK_REQUIRED);
    }
    if (issue?.path.includes("message") && issue.code === "too_big") {
      return actionFail(E.FEEDBACK_TOO_LONG);
    }
    return actionFail(
      withMessage(E.VALIDATION, "入力内容を確認してください。"),
    );
  }

  const email = parsed.data.contactEmail;
  if (email && !z.string().email().safeParse(email).success) {
    return actionFail(
      withMessage(E.VALIDATION, "メールアドレスの形式が正しくありません。"),
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hdrs = await headers();
  const userAgent = hdrs.get("user-agent")?.slice(0, 500) ?? null;
  const clientKey = feedbackClientKey({
    userId: user?.id ?? null,
    ip: clientIpFromHeaders(hdrs),
  });

  try {
    const admin = createAdminClient();
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [{ count: hourCount, error: hourError }, { count: dayCount, error: dayError }] =
      await Promise.all([
        admin
          .from("feedback_reports")
          .select("id", { count: "exact", head: true })
          .eq("client_key", clientKey)
          .gte("created_at", hourAgo),
        admin
          .from("feedback_reports")
          .select("id", { count: "exact", head: true })
          .eq("client_key", clientKey)
          .gte("created_at", dayAgo),
      ]);

    if (hourError || dayError) {
      console.error(
        "[feedback] rate check",
        hourError?.message ?? dayError?.message,
      );
      return actionFail(E.FEEDBACK_FAILED);
    }

    if (
      (hourCount ?? 0) >= FEEDBACK_LIMITS.maxPerHour ||
      (dayCount ?? 0) >= FEEDBACK_LIMITS.maxPerDay
    ) {
      return actionFail(E.FEEDBACK_RATE_LIMITED);
    }
  } catch (error) {
    console.error("[feedback] rate check unavailable", error);
    // Fall through to insert via anon client if admin is misconfigured;
    // insert itself still requires the table.
  }

  const { error } = await supabase.from("feedback_reports").insert({
    category: parsed.data.category,
    message: parsed.data.message,
    contact_email: parsed.data.contactEmail || null,
    contact_name: parsed.data.contactName || null,
    page_url: parsed.data.pageUrl || null,
    user_id: user?.id ?? null,
    user_agent: userAgent,
    client_key: clientKey,
    status: "open",
  });

  if (error) {
    console.error("[feedback]", E.FEEDBACK_FAILED.code, error.code, error.message);
    return actionFail(E.FEEDBACK_FAILED);
  }

  return actionOk();
}

export async function setFeedbackStatus(
  id: string,
  status: "open" | "done",
): Promise<ActionResult> {
  const adminUser = await requireAppAdmin();
  if (!adminUser) {
    return actionFail(E.FEEDBACK_ADMIN_FORBIDDEN);
  }

  const parsedId = z.string().uuid().safeParse(id);
  if (!parsedId.success || (status !== "open" && status !== "done")) {
    return actionFail(E.VALIDATION);
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("feedback_reports")
      .update({ status })
      .eq("id", parsedId.data);

    if (error) {
      console.error("[feedback] status", error.message);
      return actionFail(E.FEEDBACK_FAILED);
    }
  } catch (error) {
    console.error("[feedback] status admin", error);
    return actionFail(E.FEEDBACK_FAILED);
  }

  revalidatePath("/admin/feedback");
  return actionOk();
}
