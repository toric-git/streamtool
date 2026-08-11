"use client";

import { Label } from "@/components/ui/label";
import {
  FREE_MAX_MEMBERS,
  FREE_MEMBER_OPTIONS,
  PAID_MEMBER_OPTIONS,
} from "@/lib/billing/capacity";

type Props = {
  id?: string;
  name?: string;
  defaultValue?: number;
  paid: boolean;
  disabled?: boolean;
};

export function MaxMembersField({
  id = "maxMembers",
  name = "maxMembers",
  defaultValue = FREE_MAX_MEMBERS,
  paid,
  disabled,
}: Props) {
  const freeDefault = Math.min(
    Math.max(defaultValue, FREE_MEMBER_OPTIONS[0]),
    FREE_MAX_MEMBERS,
  );
  const selected = paid
    ? defaultValue
    : (FREE_MEMBER_OPTIONS as readonly number[]).includes(freeDefault)
      ? freeDefault
      : FREE_MAX_MEMBERS;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>参加可能人数</Label>
      <select
        id={id}
        name={name}
        defaultValue={String(selected)}
        disabled={disabled}
        required
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {FREE_MEMBER_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n} 人
          </option>
        ))}
        {PAID_MEMBER_OPTIONS.map((n) => (
          <option key={n} value={n} disabled={!paid}>
            {n} 人{paid ? "" : "（課金が必要）"}
          </option>
        ))}
        {paid &&
          !(FREE_MEMBER_OPTIONS as readonly number[]).includes(defaultValue) &&
          !(PAID_MEMBER_OPTIONS as readonly number[]).includes(defaultValue) &&
          defaultValue >= 2 &&
          defaultValue <= 200 && (
            <option value={defaultValue}>{defaultValue} 人</option>
          )}
      </select>
      <p className="text-xs text-muted-foreground">
        無料プランは最大 {FREE_MAX_MEMBERS} 人まで。
        {paid
          ? " 有料プランのため 8 人以上も設定できます。"
          : " 8 人以上は課金が必要です。"}
      </p>
      {!paid && defaultValue > FREE_MAX_MEMBERS && (
        <p className="text-xs font-semibold text-amber-800">
          現在の設定は {defaultValue} 人です。無料プランでは {FREE_MAX_MEMBERS}{" "}
          人以下を選んで保存してください。
        </p>
      )}
    </div>
  );
}
