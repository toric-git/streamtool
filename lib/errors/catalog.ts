/**
 * ユーザー向けエラー番号カタログ。
 * 画面表示・問い合わせ対応用。番号は一度割り当てたら変更しない。
 *
 * 帯域:
 *   E10xx 認証
 *   E20xx / E21xx / E22xx 部屋（共通・作成・設定・退出）
 *   E23xx 部屋参加
 *   E30xx メンバー
 *   E40xx サウンド / メディア / 初期サウンドシード
 *   E45xx カテゴリー
 *   E50xx 再生 / 音声エンジン
 *   E90xx 入力検証・クライアント・不明
 *
 * 欠番: E4019（未使用。再割り当てしない）
 * 欠番帯: E60xx（旧 OBS トークン連携。再割り当てしない）
 * 表示名: Google full_name は使わない。user_metadata.display_name のみ採用。
 * 一覧ドキュメント: docs/ERROR_CODES.md
 */

export type ErrorCode = `E${number}`;

export type AppError = {
  code: ErrorCode;
  message: string;
};

function e(code: ErrorCode, message: string): AppError {
  return { code, message };
}

export const E = {
  // --- Auth E10xx ---
  AUTH_REQUIRED: e("E1001", "ログインが必要です。"),
  AUTH_INVALID_CREDENTIALS: e(
    "E1002",
    "メールアドレスまたはパスワードが正しくありません。",
  ),
  AUTH_EMAIL_INVALID: e(
    "E1003",
    "このメールアドレスは使えません。Gmail など実在する形式のアドレスを使ってください。",
  ),
  AUTH_ALREADY_REGISTERED: e(
    "E1004",
    "このメールアドレスは既に登録されています。ログインしてください。",
  ),
  AUTH_EMAIL_NOT_CONFIRMED: e(
    "E1005",
    "メールアドレスの確認が完了していません。受信トレイを確認するか、Supabase で Confirm email をオフにしてください。",
  ),
  AUTH_PROVIDER_DISABLED: e(
    "E1006",
    "このログイン方法は有効になっていません。Supabase の Providers 設定を確認してください。",
  ),
  AUTH_RATE_LIMIT: e("E1007", "しばらく待ってから再度お試しください。"),
  AUTH_CONNECTION: e(
    "E1008",
    "Supabase に接続できませんでした。本番URLで試すか、Norton の HTTPS スキャンをオフにしてからローカルを再起動してください。",
  ),
  AUTH_OAUTH_FAILED: e(
    "E1009",
    "外部ログインに失敗しました。もう一度お試しください。",
  ),
  AUTH_FAILED: e(
    "E1010",
    "認証に失敗しました。入力内容を確認して再度お試しください。",
  ),
  AUTH_ANON_FAILED: e(
    "E1011",
    "ゲスト認証に失敗しました。Supabase で Anonymous Sign-Ins が有効か確認してください。",
  ),
  AUTH_GOOGLE_FAILED: e(
    "E1012",
    "Googleログインの開始に失敗しました。もう一度お試しください。",
  ),
  AUTH_DISPLAY_NAME_REQUIRED: e(
    "E1013",
    "表示名の設定が必要です。アプリで使う名前を入力してください。",
  ),
  PROFILE_NAME_UPDATE_FAILED: e(
    "E1014",
    "表示名の保存に失敗しました。もう一度お試しください。",
  ),

  // --- Room common E20xx ---
  ROOM_NOT_MEMBER: e("E2001", "この部屋のメンバーではありません。"),
  ROOM_NOT_FOUND: e("E2002", "部屋が見つかりません。"),
  ROOM_FORBIDDEN: e("E2003", "この操作を行う権限がありません。"),
  ROOM_SERVER_CONFIG: e(
    "E2004",
    "サーバー設定が不足しています。SUPABASE_SERVICE_ROLE_KEY を設定してください。",
  ),

  // --- Room create E21xx ---
  ROOM_CREATE_PROFILE: e(
    "E2101",
    "プロフィールの準備に失敗しました。再ログイン後にもう一度お試しください。",
  ),
  ROOM_CREATE_FAILED: e(
    "E2102",
    "部屋の作成に失敗しました。しばらくしてから再度お試しください。",
  ),
  ROOM_CREATE_CODE: e(
    "E2103",
    "部屋コードの発行に失敗しました。再試行してください。",
  ),
  ROOM_CREATE_MEMBER: e(
    "E2104",
    "部屋メンバーの登録に失敗しました。もう一度作成してください。",
  ),
  ROOM_CREATE_SEED_FAILED: e(
    "E2105",
    "部屋は作成されましたが、初期サウンド（正解・ハズレ・ドドン・ファンファーレ）の設置に失敗しました。サウンド管理から追加してください。",
  ),
  ROOM_CAPACITY_PAID_REQUIRED: e(
    "E2106",
    "参加可能人数を 8 人以上にするには課金が必要です。無料プランは 7 人までです。",
  ),

  // --- Room update / delete / leave E22xx ---
  ROOM_UPDATE_FORBIDDEN: e(
    "E2201",
    "オーナー設定を変更する権限がありません。",
  ),
  ROOM_UPDATE_FAILED: e("E2202", "オーナー設定の更新に失敗しました。"),
  ROOM_DELETE_FORBIDDEN: e(
    "E2203",
    "部屋を削除できるのはオーナーのみです。",
  ),
  ROOM_DELETE_FAILED: e("E2204", "部屋の削除に失敗しました。"),
  ROOM_OWNER_LEAVE: e(
    "E2205",
    "オーナーは退出できません。所有権を移譲するか、部屋を削除してください。",
  ),
  ROOM_LEAVE_FAILED: e(
    "E2206",
    "退出に失敗しました。通信状態を確認して再試行してください。",
  ),

  // --- Room join E23xx ---
  ROOM_JOIN_GUEST_NAME: e("E2301", "参加には表示名が必要です。"),
  ROOM_JOIN_AUTH_REQUIRED: e(
    "E2302",
    "参加するにはログインまたはゲスト参加が必要です。",
  ),
  ROOM_JOIN_INFO_FAILED: e("E2303", "部屋情報の取得に失敗しました。"),
  ROOM_JOIN_INVALID_CODE: e(
    "E2304",
    "招待コードが無効です。コードを確認してください。",
  ),
  ROOM_JOIN_FULL: e(
    "E2305",
    "部屋が満員です。空きが出てから再度お試しください。",
  ),
  ROOM_JOIN_PASSWORD_REQUIRED: e(
    "E2306",
    "この部屋には参加パスワードが必要です。",
  ),
  ROOM_JOIN_PASSWORD_WRONG: e("E2307", "参加パスワードが違います。"),
  ROOM_JOIN_GUEST_DISABLED: e(
    "E2308",
    "この部屋はゲスト参加が許可されていません。ログインして参加してください。",
  ),
  ROOM_JOIN_FAILED: e(
    "E2309",
    "部屋への参加に失敗しました。入力内容を確認して再度お試しください。",
  ),
  ROOM_JOIN_NOT_AUTHENTICATED: e(
    "E2310",
    "参加するにはログインまたはゲスト認証が必要です。",
  ),

  // --- Members E30xx ---
  MEMBER_PERMISSION: e("E3001", "この操作を行う権限がありません。"),
  MEMBER_OWNER_PROTECTED: e(
    "E3002",
    "オーナーに対してこの操作はできません。",
  ),
  MEMBER_SELF_FORBIDDEN: e("E3003", "自分自身には実行できません。"),
  MEMBER_NOT_FOUND: e(
    "E3004",
    "対象のメンバーが見つかりません。既に退出している可能性があります。",
  ),
  MEMBER_INVALID_ROLE: e("E3005", "指定された役割が不正です。"),
  MEMBER_GUEST_TRANSFER: e(
    "E3006",
    "ゲストには所有権を移譲できません。",
  ),
  MEMBER_ALREADY_OWNER: e("E3007", "すでにオーナーです。"),
  MEMBER_TRANSFER_FORBIDDEN: e(
    "E3008",
    "所有権を移譲できるのはオーナーのみです。",
  ),
  MEMBER_FAILED: e(
    "E3009",
    "メンバー操作に失敗しました。権限と対象を確認して再試行してください。",
  ),

  // --- Sounds / media E40xx ---
  SOUND_UPLOAD_DISABLED: e("E4001", "アップロードが許可されていません。"),
  SOUND_AUDIO_PATH_INVALID: e("E4002", "音声パスが不正です。"),
  SOUND_IMAGE_PATH_INVALID: e("E4003", "画像パスが不正です。"),
  SOUND_CREATE_FAILED: e(
    "E4004",
    "サウンドの登録に失敗しました。ファイルはアップロード済みの可能性があります。再試行するか管理者に連絡してください。",
  ),
  SOUND_NOT_FOUND: e("E4005", "サウンドが見つかりません。"),
  SOUND_EDIT_FORBIDDEN: e("E4006", "編集権限がありません。"),
  SOUND_UPDATE_FAILED: e("E4007", "更新に失敗しました。"),
  SOUND_DELETE_FORBIDDEN: e("E4008", "削除権限がありません。"),
  SOUND_DELETE_FAILED: e("E4009", "削除に失敗しました。再試行してください。"),
  SOUND_STORAGE_CLEANUP: e(
    "E4010",
    "データベース上の削除は成功しましたが、ファイル削除に失敗しました。時間をおいて再試行するか管理者に連絡してください。",
  ),
  SOUND_APPROVE_FAILED: e(
    "E4011",
    "承認に失敗しました。権限を確認してください。",
  ),
  SOUND_REJECT_FAILED: e(
    "E4012",
    "却下に失敗しました。権限を確認してください。",
  ),
  SOUND_REORDER_FAILED: e("E4013", "並び替えに失敗しました。"),
  SOUND_FILE_REQUIRED: e("E4014", "音声ファイルを選択してください。"),
  SOUND_DURATION_READ: e(
    "E4015",
    "音声の再生時間を読み取れませんでした。別のファイルを試してください。",
  ),
  SOUND_META_READ: e("E4016", "音声メタデータの読み取りに失敗しました。"),
  SOUND_PREVIEW_REQUIRED: e("E4017", "試聴する音声を選択してください。"),
  SOUND_PREVIEW_FAILED: e(
    "E4018",
    "試聴に失敗しました。ブラウザの自動再生制限を確認してください。",
  ),
  MEDIA_AUDIO_VERIFY: e(
    "E4020",
    "アップロード済み音声の検証に失敗しました。再アップロードしてください。",
  ),
  MEDIA_AUDIO_EMPTY: e("E4021", "音声ファイルが空です。"),
  MEDIA_IMAGE_VERIFY: e(
    "E4022",
    "アップロード済み画像の検証に失敗しました。再アップロードしてください。",
  ),
  MEDIA_UPLOAD_FAILED: e("E4023", "ファイルのアップロードに失敗しました。"),
  MEDIA_UPLOAD_URL_FAILED: e(
    "E4024",
    "アップロード用URLの取得に失敗しました。",
  ),
  SOUND_SEED_FORBIDDEN: e(
    "E4025",
    "初期サウンドを追加できるのはオーナーまたは管理者のみです。",
  ),
  SOUND_SEED_FAILED: e(
    "E4026",
    "初期サウンドの追加に失敗しました。時間をおいて再試行してください。",
  ),
  SOUND_SEED_NONE: e(
    "E4027",
    "追加できる初期サウンドがありません（同名の音が既に登録済みです）。",
  ),
  SOUND_SEED_ASSET_MISSING: e(
    "E4028",
    "初期サウンドの音声ファイルが見つかりません。サーバー設定を確認してください。",
  ),
  SOUND_SEED_UPLOAD_FAILED: e(
    "E4029",
    "初期サウンドのストレージアップロードに失敗しました。",
  ),
  SOUND_SEED_INSERT_FAILED: e(
    "E4030",
    "初期サウンドのデータベース登録に失敗しました。",
  ),
  SOUND_SEED_PARTIAL: e(
    "E4031",
    "一部の初期サウンドだけ追加できました。不足分はサウンド管理から再追加してください。",
  ),

  // --- Categories E45xx ---
  CATEGORY_FORBIDDEN: e(
    "E4501",
    "パッド（カテゴリー）の操作権限がありません。",
  ),
  CATEGORY_NAME_INVALID: e("E4502", "パッド名が不正です。"),
  CATEGORY_CREATE_FAILED: e("E4503", "パッドの作成に失敗しました。"),
  CATEGORY_NOT_FOUND: e("E4504", "パッドが見つかりません。"),
  CATEGORY_RENAME_FAILED: e("E4505", "パッド名の変更に失敗しました。"),

  // --- Playback E50xx ---
  PLAY_COOLDOWN: e("E5001", "クールダウン中です。連打を控えてください。"),
  PLAY_RATE_LIMIT: e(
    "E5002",
    "送信回数の上限に達しました。1分ほど待ってください。",
  ),
  PLAY_DENIED: e(
    "E5003",
    "再生が拒否されました。権限またはミュート状態を確認してください。",
  ),
  PLAY_FAILED: e("E5004", "再生イベントの送信に失敗しました。"),
  PLAY_STOP_ALL_FAILED: e("E5005", "全停止に失敗しました。"),
  PLAY_TEST_NO_SOUND: e(
    "E5006",
    "テスト再生する承認済みサウンドがありません。",
  ),
  PLAY_TEST_FAILED: e("E5007", "テスト再生の送信に失敗しました。"),
  AUDIO_UNLOCK_FAILED: e(
    "E5008",
    "音声の有効化に失敗しました。ブラウザの設定を確認してください。",
  ),
  AUDIO_ENGINE_NOT_READY: e(
    "E5009",
    "音声エンジンの準備ができていません。もう一度タップしてください。",
  ),
  AUDIO_PLAYBACK_FAILED: e(
    "E5010",
    "音声の再生に失敗しました。再読み込みするか、音声を有効化してください。",
  ),
  AUDIO_LOCKED: e(
    "E5011",
    "音声がロックされています。画面の案内に従って音声をオンにしてください。",
  ),

  // --- Validation / unknown E90xx ---
  VALIDATION: e("E9001", "入力内容が正しくありません。"),
  FEEDBACK_REQUIRED: e("E9101", "ご要望・不具合の内容を入力してください。"),
  FEEDBACK_TOO_LONG: e(
    "E9102",
    "メッセージが長すぎます。4000文字以内で入力してください。",
  ),
  FEEDBACK_FAILED: e(
    "E9103",
    "送信に失敗しました。時間をおいてもう一度お試しください。",
  ),
  FEEDBACK_RATE_LIMITED: e(
    "E9104",
    "送信が集中しています。しばらく時間をおいてから再度お試しください。",
  ),
  FEEDBACK_ADMIN_FORBIDDEN: e(
    "E9105",
    "フィードバック管理の権限がありません。",
  ),
  UNKNOWN: e(
    "E9999",
    "予期しないエラーが発生しました。しばらくしてから再度お試しください。",
  ),
} as const;

export type ErrorKey = keyof typeof E;

/** 定義をコピーし、メッセージだけ差し替える（Zod の詳細など）。 */
export function withMessage(base: AppError, message: string): AppError {
  return { code: base.code, message };
}

export function formatErrorCodeLine(code: ErrorCode): string {
  return `エラー番号 ${code}`;
}
