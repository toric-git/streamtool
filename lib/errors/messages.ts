export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("fetch failed") ||
    lower.includes("failed to fetch") ||
    lower.includes("network") ||
    lower.includes("certificate") ||
    lower.includes("ssl") ||
    lower.includes("tls") ||
    lower.includes("retryable")
  ) {
    return "Supabase に接続できませんでした。ネット接続、SSL検査（ウイルス対策ソフト）、プロジェクトURLを確認してください。";
  }
  if (lower.includes("invalid login")) {
    return "メールアドレスまたはパスワードが正しくありません。";
  }
  if (
    lower.includes("already registered") ||
    lower.includes("already been registered")
  ) {
    return "このメールアドレスは既に登録されています。ログインしてください。";
  }
  if (lower.includes("email not confirmed")) {
    return "メールアドレスの確認が完了していません。受信トレイを確認してください。";
  }
  if (lower.includes("rate limit")) {
    return "しばらく待ってから再度お試しください。";
  }
  return "認証に失敗しました。入力内容を確認して再度お試しください。";
}

export function mapRoomJoinError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("room not found") || lower.includes("p0002")) {
    return "部屋が見つかりません。ルームコードを確認してください。";
  }
  if (lower.includes("password")) {
    return "参加パスワードが違うか、パスワード付きの部屋です。";
  }
  if (lower.includes("full")) {
    return "部屋が満員です。空きが出てから再度お試しください。";
  }
  if (lower.includes("guest")) {
    return "この部屋はゲスト参加が許可されていません。ログインして参加してください。";
  }
  if (lower.includes("not authenticated")) {
    return "参加するにはログインまたはゲスト認証が必要です。";
  }
  return "部屋への参加に失敗しました。入力内容を確認して再度お試しください。";
}

export function mapMemberError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("permission denied")) {
    return "この操作を行う権限がありません。";
  }
  if (lower.includes("cannot kick owner") || lower.includes("cannot change owner")) {
    return "オーナーに対してこの操作はできません。";
  }
  if (lower.includes("cannot kick yourself") || lower.includes("cannot change own")) {
    return "自分自身には実行できません。";
  }
  if (lower.includes("member not found")) {
    return "対象のメンバーが見つかりません。既に退出している可能性があります。";
  }
  if (lower.includes("invalid role")) {
    return "指定された役割が不正です。";
  }
  if (lower.includes("guest")) {
    return "ゲストには所有権を移譲できません。";
  }
  if (lower.includes("already owner")) {
    return "すでにオーナーです。";
  }
  return "メンバー操作に失敗しました。権限と対象を確認して再試行してください。";
}

export function mapPlaybackError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("cooldown")) {
    return "クールダウン中です。連打を控えてください。";
  }
  if (lower.includes("rate limit")) {
    return "送信回数の上限に達しました。1分ほど待ってください。";
  }
  if (lower.includes("denied") || lower.includes("permission")) {
    return "再生が拒否されました。権限またはミュート状態を確認してください。";
  }
  return "再生イベントの送信に失敗しました。";
}

export function mapRoomPageError(code: string | undefined): string | null {
  if (!code) return null;
  if (code === "owner_leave") {
    return "オーナーは退出できません。所有権を移譲するか、部屋を削除してください。";
  }
  if (code === "leave_failed") {
    return "退出に失敗しました。通信状態を確認して再試行してください。";
  }
  return "操作に失敗しました。";
}
