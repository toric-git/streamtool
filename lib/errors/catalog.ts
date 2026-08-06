/**
 * ユーザー向けエラー番号カタログ。
 * 画面表示・問い合わせ対応用。番号は一度割り当てたら変更しない。
 *
 * 帯域:
 *   E10xx 認証
 *   E20xx 部屋（共通・作成・設定・退出）
 *   E23xx 部屋参加
 *   E30xx メンバー
 *   E40xx サウンド / メディア
 *   E45xx カテゴリー
 *   E50xx 再生
 *   E60xx OBS
 *   E90xx 入力検証・クライアント・不明
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

  // --- Room update / delete / leave E22xx ---
  ROOM_UPDATE_FORBIDDEN: e(
    "E2201",
    "部屋設定を変更する権限がありません。",
  ),
  ROOM_UPDATE_FAILED: e("E2202", "部屋設定の更新に失敗しました。"),
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
  ROOM_JOIN_GUEST_NAME: e("E2301", "ゲスト参加には表示名が必要です。"),
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

  // --- Categories E45xx ---
  CATEGORY_FORBIDDEN: e("E4501", "カテゴリー作成権限がありません。"),
  CATEGORY_NAME_INVALID: e("E4502", "カテゴリー名が不正です。"),
  CATEGORY_CREATE_FAILED: e("E4503", "カテゴリーの作成に失敗しました。"),

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

  // --- OBS E60xx ---
  OBS_ISSUE_FORBIDDEN: e(
    "E6001",
    "OBSトークンを発行できるのはオーナーのみです。",
  ),
  OBS_CONFIG_MISSING: e(
    "E6002",
    "SUPABASE_SERVICE_ROLE_KEY または OBS_TOKEN_PEPPER が未設定です。",
  ),
  OBS_ISSUE_FAILED: e("E6003", "OBSトークンの発行に失敗しました。"),
  OBS_ISSUE_INVALID: e("E6004", "発行結果が不正です。"),
  OBS_VALIDATE_FAILED: e("E6005", "OBSトークンの検証に失敗しました。"),
  OBS_ANON_FAILED: e(
    "E6006",
    "OBS用の匿名サインインに失敗しました。Anonymous Sign-Ins を有効にしてください。",
  ),
  OBS_SESSION_FAILED: e("E6007", "OBSセッションの準備に失敗しました。"),
  OBS_INIT_FAILED: e("E6008", "OBSの初期化に失敗しました。"),

  // --- Validation / unknown E90xx ---
  VALIDATION: e("E9001", "入力内容が正しくありません。"),
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
