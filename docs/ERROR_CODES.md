# エラー番号一覧

画面表示・お問い合わせ対応用。定義の単一ソースは `lib/errors/catalog.ts`。  
**番号は一度割り当てたら変更しない。**

帯域:

| 帯域 | 用途 |
|------|------|
| E10xx | 認証 |
| E20xx / E21xx / E22xx | 部屋（共通・作成・設定・退出） |
| E23xx | 部屋参加 |
| E30xx | メンバー |
| E40xx | サウンド / メディア / 初期サウンド |
| E45xx | カテゴリー |
| E50xx | 再生 / 音声エンジン |
| E60xx | OBS |
| E90xx | 入力検証・不明 |

---

## 今回の修正で追加・整理した番号（新規）

音声アンロック安定化、初期4音シード、ぽんだしパッド周りで想定されるエラーです。

| 番号 | キー | メッセージ | 想定シーン |
|------|------|------------|------------|
| E2105 | `ROOM_CREATE_SEED_FAILED` | 部屋は作成されたが初期サウンド設置に失敗 | 部屋作成直後の自動シード失敗（ログ／サポート用。部屋自体は使える） |
| E4025 | `SOUND_SEED_FORBIDDEN` | 初期サウンド追加はオーナー／管理者のみ | （手動シード廃止。互換のためコードは残置） |
| E4026 | `SOUND_SEED_FAILED` | 初期サウンド追加に失敗 | 部屋作成時シードで1件も追加できなかった（ログ） |
| E4027 | `SOUND_SEED_NONE` | 同名のため追加できる初期音がない | （手動シード廃止。互換のためコードは残置） |
| E4028 | `SOUND_SEED_ASSET_MISSING` | 初期音ファイルがサーバーにない | `lib/sounds/default-assets` 欠損・トレース漏れ（ログ） |
| E4029 | `SOUND_SEED_UPLOAD_FAILED` | 初期音の Storage アップロード失敗 | Supabase Storage 障害・権限（ログ） |
| E4030 | `SOUND_SEED_INSERT_FAILED` | 初期音の DB 登録失敗 | RLS／制約違反など（ログ。アップロード済みファイルは削除試行） |
| E4031 | `SOUND_SEED_PARTIAL` | 一部だけ追加できた | 4音のうち一部成功・一部失敗 |
| E5008 | `AUDIO_UNLOCK_FAILED` | 音声の有効化に失敗 | 「タップして参加する」でアンロック失敗 |
| E5009 | `AUDIO_ENGINE_NOT_READY` | 音声エンジン未準備 | エンジン生成前にアンロックを押した |
| E5010 | `AUDIO_PLAYBACK_FAILED` | ローカル再生失敗 | Realtime 受信後の Howler 再生エラー |
| E5011 | `AUDIO_LOCKED` | 音声がロックされている | 未アンロック状態で再生しようとした |

関連する既存番号（新規ではないが今回の導線でも使う）:

| 番号 | キー | 用途 |
|------|------|------|
| E5001 | `PLAY_COOLDOWN` | パッド／ホットキー連打 |
| E5002 | `PLAY_RATE_LIMIT` | 再生 RPC レート制限 |
| E5003 | `PLAY_DENIED` | 権限なし・ミュート |
| E5004 | `PLAY_FAILED` | 再生イベント送信失敗 |
| E5005 | `PLAY_STOP_ALL_FAILED` | 全停止失敗 |
| E4008 / E4009 | 削除権限／削除失敗 | オーナーが初期音を含むサウンドを削除 |
| E4001 系 | アップロード系 | オーナーが追加アップロード |

欠番: **E4019**（未使用。再割り当て禁止のため空けたまま）。

---

## 全一覧

### E10xx 認証

| 番号 | キー | メッセージ |
|------|------|------------|
| E1001 | AUTH_REQUIRED | ログインが必要です。 |
| E1002 | AUTH_INVALID_CREDENTIALS | メールアドレスまたはパスワードが正しくありません。 |
| E1003 | AUTH_EMAIL_INVALID | このメールアドレスは使えません。… |
| E1004 | AUTH_ALREADY_REGISTERED | このメールアドレスは既に登録されています。… |
| E1005 | AUTH_EMAIL_NOT_CONFIRMED | メールアドレスの確認が完了していません。… |
| E1006 | AUTH_PROVIDER_DISABLED | このログイン方法は有効になっていません。… |
| E1007 | AUTH_RATE_LIMIT | しばらく待ってから再度お試しください。 |
| E1008 | AUTH_CONNECTION | Supabase に接続できませんでした。… |
| E1009 | AUTH_OAUTH_FAILED | 外部ログインに失敗しました。… |
| E1010 | AUTH_FAILED | 認証に失敗しました。… |
| E1011 | AUTH_ANON_FAILED | ゲスト認証に失敗しました。… |
| E1012 | AUTH_GOOGLE_FAILED | Googleログインの開始に失敗しました。… |
| E1013 | AUTH_DISPLAY_NAME_REQUIRED | 表示名の設定が必要です。… **（新規）** |
| E1014 | PROFILE_NAME_UPDATE_FAILED | 表示名の保存に失敗しました。… **（新規）** |

### E20xx 部屋（共通）

| 番号 | キー | メッセージ |
|------|------|------------|
| E2001 | ROOM_NOT_MEMBER | この部屋のメンバーではありません。 |
| E2002 | ROOM_NOT_FOUND | 部屋が見つかりません。 |
| E2003 | ROOM_FORBIDDEN | この操作を行う権限がありません。 |
| E2004 | ROOM_SERVER_CONFIG | サーバー設定が不足しています。… |

### E21xx 部屋作成

| 番号 | キー | メッセージ |
|------|------|------------|
| E2101 | ROOM_CREATE_PROFILE | プロフィールの準備に失敗しました。… |
| E2102 | ROOM_CREATE_FAILED | 部屋の作成に失敗しました。… |
| E2103 | ROOM_CREATE_CODE | 部屋コードの発行に失敗しました。… |
| E2104 | ROOM_CREATE_MEMBER | 部屋メンバーの登録に失敗しました。… |
| E2105 | ROOM_CREATE_SEED_FAILED | 部屋は作成されましたが、初期サウンドの設置に失敗しました。… **（新規）** |

### E22xx 部屋設定・削除・退出

| 番号 | キー | メッセージ |
|------|------|------------|
| E2201 | ROOM_UPDATE_FORBIDDEN | 部屋設定を変更する権限がありません。 |
| E2202 | ROOM_UPDATE_FAILED | 部屋設定の更新に失敗しました。 |
| E2203 | ROOM_DELETE_FORBIDDEN | 部屋を削除できるのはオーナーのみです。 |
| E2204 | ROOM_DELETE_FAILED | 部屋の削除に失敗しました。 |
| E2205 | ROOM_OWNER_LEAVE | オーナーは退出できません。… |
| E2206 | ROOM_LEAVE_FAILED | 退出に失敗しました。… |

### E23xx 部屋参加

| 番号 | キー | メッセージ |
|------|------|------------|
| E2301 | ROOM_JOIN_GUEST_NAME | ゲスト参加には表示名が必要です。 |
| E2302 | ROOM_JOIN_AUTH_REQUIRED | 参加するにはログインまたはゲスト参加が必要です。 |
| E2303 | ROOM_JOIN_INFO_FAILED | 部屋情報の取得に失敗しました。 |
| E2304 | ROOM_JOIN_INVALID_CODE | 招待コードが無効です。… |
| E2305 | ROOM_JOIN_FULL | 部屋が満員です。… |
| E2306 | ROOM_JOIN_PASSWORD_REQUIRED | この部屋には参加パスワードが必要です。 |
| E2307 | ROOM_JOIN_PASSWORD_WRONG | 参加パスワードが違います。 |
| E2308 | ROOM_JOIN_GUEST_DISABLED | この部屋はゲスト参加が許可されていません。… |
| E2309 | ROOM_JOIN_FAILED | 部屋への参加に失敗しました。… |
| E2310 | ROOM_JOIN_NOT_AUTHENTICATED | 参加するにはログインまたはゲスト認証が必要です。 |

### E30xx メンバー

| 番号 | キー | メッセージ |
|------|------|------------|
| E3001 | MEMBER_PERMISSION | この操作を行う権限がありません。 |
| E3002 | MEMBER_OWNER_PROTECTED | オーナーに対してこの操作はできません。 |
| E3003 | MEMBER_SELF_FORBIDDEN | 自分自身には実行できません。 |
| E3004 | MEMBER_NOT_FOUND | 対象のメンバーが見つかりません。… |
| E3005 | MEMBER_INVALID_ROLE | 指定された役割が不正です。 |
| E3006 | MEMBER_GUEST_TRANSFER | ゲストには所有権を移譲できません。 |
| E3007 | MEMBER_ALREADY_OWNER | すでにオーナーです。 |
| E3008 | MEMBER_TRANSFER_FORBIDDEN | 所有権を移譲できるのはオーナーのみです。 |
| E3009 | MEMBER_FAILED | メンバー操作に失敗しました。… |

### E40xx サウンド / メディア

| 番号 | キー | メッセージ |
|------|------|------------|
| E4001 | SOUND_UPLOAD_DISABLED | アップロードが許可されていません。 |
| E4002 | SOUND_AUDIO_PATH_INVALID | 音声パスが不正です。 |
| E4003 | SOUND_IMAGE_PATH_INVALID | 画像パスが不正です。 |
| E4004 | SOUND_CREATE_FAILED | サウンドの登録に失敗しました。… |
| E4005 | SOUND_NOT_FOUND | サウンドが見つかりません。 |
| E4006 | SOUND_EDIT_FORBIDDEN | 編集権限がありません。 |
| E4007 | SOUND_UPDATE_FAILED | 更新に失敗しました。 |
| E4008 | SOUND_DELETE_FORBIDDEN | 削除権限がありません。 |
| E4009 | SOUND_DELETE_FAILED | 削除に失敗しました。… |
| E4010 | SOUND_STORAGE_CLEANUP | DB削除成功・ファイル削除失敗 |
| E4011 | SOUND_APPROVE_FAILED | 承認に失敗しました。権限を確認してください。 |
| E4012 | SOUND_REJECT_FAILED | 却下に失敗しました。権限を確認してください。 |
| E4013 | SOUND_REORDER_FAILED | 並び替えに失敗しました。 |
| E4014 | SOUND_FILE_REQUIRED | 音声ファイルを選択してください。 |
| E4015 | SOUND_DURATION_READ | 再生時間を読み取れませんでした。… |
| E4016 | SOUND_META_READ | 音声メタデータの読み取りに失敗しました。 |
| E4017 | SOUND_PREVIEW_REQUIRED | 試聴する音声を選択してください。 |
| E4018 | SOUND_PREVIEW_FAILED | 試聴に失敗しました。… |
| — | *(E4019 欠番)* | 未使用 |
| E4020 | MEDIA_AUDIO_VERIFY | アップロード済み音声の検証に失敗 |
| E4021 | MEDIA_AUDIO_EMPTY | 音声ファイルが空です。 |
| E4022 | MEDIA_IMAGE_VERIFY | アップロード済み画像の検証に失敗 |
| E4023 | MEDIA_UPLOAD_FAILED | ファイルのアップロードに失敗しました。 |
| E4024 | MEDIA_UPLOAD_URL_FAILED | アップロード用URLの取得に失敗しました。 |
| E4025 | SOUND_SEED_FORBIDDEN | 初期サウンド追加はオーナー／管理者のみ **（新規）** |
| E4026 | SOUND_SEED_FAILED | 初期サウンド追加に失敗 **（新規）** |
| E4027 | SOUND_SEED_NONE | 同名のため追加不要／不可 **（新規）** |
| E4028 | SOUND_SEED_ASSET_MISSING | 初期音ファイル欠損 **（新規）** |
| E4029 | SOUND_SEED_UPLOAD_FAILED | 初期音アップロード失敗 **（新規）** |
| E4030 | SOUND_SEED_INSERT_FAILED | 初期音 DB 登録失敗 **（新規）** |
| E4031 | SOUND_SEED_PARTIAL | 初期音の部分成功 **（新規）** |

### E45xx カテゴリー

| 番号 | キー | メッセージ |
|------|------|------------|
| E4501 | CATEGORY_FORBIDDEN | パッド（カテゴリー）の操作権限がありません |
| E4502 | CATEGORY_NAME_INVALID | パッド名が不正です |
| E4503 | CATEGORY_CREATE_FAILED | パッドの作成に失敗しました |
| E4504 | CATEGORY_NOT_FOUND | パッドが見つかりません |
| E4505 | CATEGORY_RENAME_FAILED | パッド名の変更に失敗しました |

### E50xx 再生 / 音声

| 番号 | キー | メッセージ |
|------|------|------------|
| E5001 | PLAY_COOLDOWN | クールダウン中です。… |
| E5002 | PLAY_RATE_LIMIT | 送信回数の上限に達しました。… |
| E5003 | PLAY_DENIED | 再生が拒否されました。… |
| E5004 | PLAY_FAILED | 再生イベントの送信に失敗しました。 |
| E5005 | PLAY_STOP_ALL_FAILED | 全停止に失敗しました。 |
| E5006 | PLAY_TEST_NO_SOUND | テスト再生する承認済みサウンドがありません。 |
| E5007 | PLAY_TEST_FAILED | テスト再生の送信に失敗しました。 |
| E5008 | AUDIO_UNLOCK_FAILED | 音声の有効化に失敗 **（新規）** |
| E5009 | AUDIO_ENGINE_NOT_READY | 音声エンジン未準備 **（新規）** |
| E5010 | AUDIO_PLAYBACK_FAILED | ローカル再生失敗 **（新規）** |
| E5011 | AUDIO_LOCKED | 音声ロック中 **（新規）** |

### E60xx OBS

| 番号 | キー | メッセージ |
|------|------|------------|
| E6001 | OBS_ISSUE_FORBIDDEN | OBSトークン発行はオーナーのみ |
| E6002 | OBS_CONFIG_MISSING | SERVICE_ROLE / PEPPER 未設定 |
| E6003 | OBS_ISSUE_FAILED | OBSトークン発行失敗 |
| E6004 | OBS_ISSUE_INVALID | 発行結果が不正 |
| E6005 | OBS_VALIDATE_FAILED | OBSトークン検証失敗 |
| E6006 | OBS_ANON_FAILED | OBS匿名サインイン失敗 |
| E6007 | OBS_SESSION_FAILED | OBSセッション準備失敗 |
| E6008 | OBS_INIT_FAILED | OBS初期化失敗 |

### E90xx 検証・不明

| 番号 | キー | メッセージ |
|------|------|------------|
| E9001 | VALIDATION | 入力内容が正しくありません。 |
| E9999 | UNKNOWN | 予期しないエラーが発生しました。… |
