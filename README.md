# Streamtool

VTuber向け配信ツールハブです。現在利用可能なツールはリアルタイムサウンドボードで、コメント読み上げ・字幕翻訳などを順次追加予定です。

サウンドボードでは、部屋の参加者が効果音ボタンを押すと、同室の全員と OBS ブラウザソースで同じ音が再生されます。

## 技術構成

- Next.js 16 (App Router) + TypeScript strict
- Tailwind CSS 4 + 最小 UI primitives（button/input/label/card/alert）
- Supabase Auth / PostgreSQL / Realtime / Storage
- Howler.js（音声）
- dnd-kit（並び替え）
- Zod（入力検証）
- Vitest / Testing Library / Playwright（E2E 骨格）

## 必要条件

- Node.js 20+
- npm
- Supabase プロジェクト

## インストール

```bash
npm install
cp .env.example .env.local
```

## 環境変数

| 変数 | 説明 |
|------|------|
| `NEXT_PUBLIC_APP_URL` | アプリ URL（例: http://localhost:3000） |
| `NEXT_PUBLIC_APP_NAME` | ハブ表示名（未設定時は `Streamtool`） |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **サーバーのみ**。用途: パスワード付き参加、OBSトークン発行/検証、Storage削除、OBSセッション用メンバー登録 |
| `OBS_TOKEN_PEPPER` | OBSトークンハッシュ用ペッパー |

## Supabase セットアップ

詳細は `docs/SETUP_PHASE2.md` も参照。

1. プロジェクト作成
2. Authentication
   - Email 有効
   - **Anonymous Sign-Ins 有効**（ゲスト / OBS に必須）
   - （任意）Google OAuth
   - Redirect URLs に `http://localhost:3000/auth/callback`
3. SQL Editor で以下を順に実行
   - `supabase/migrations/20260803220000_init.sql`
   - `supabase/migrations/20260804120000_member_management.sql`
   - `supabase/migrations/20260804130000_ownership_transfer.sql`
4. Storage に `room-audio` / `room-images`（migration が作成）
5. Realtime publication に `playback_events` 等が含まれること確認

CLI の場合:

```bash
npx supabase login
npx supabase link --project-ref <REF>
npx supabase db push
```

## ローカル起動

```bash
npm run dev
```

## コマンド

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e   # Playwright（要: npx playwright install）
```

## Vercel デプロイ

1. リポジトリを Vercel に接続
2. 上記環境変数を設定（`NEXT_PUBLIC_APP_URL` は本番 URL）
3. Supabase Auth Redirect URLs に本番 callback を追加

## OBS ブラウザソース設定

1. 部屋設定で「OBSトークンを発行」
2. 表示された URL をコピー（**一度だけ表示**）
3. OBS → ソース → ブラウザ → URL に貼り付け
4. 幅・高さは任意（映像は透明。音だけ使う想定）
5. 推奨: 「OBS経由で音声を制御する」をオンにし、ブラウザソースの音量を OBS で調整
6. デバッグ: URL 末尾に `&debug=1`

### 音が出ない場合

- ブラウザソースを右クリック → 更新
- Anonymous Sign-Ins が有効か
- トークン再発行後に古い URL を使っていないか
- 部屋に承認済みサウンドがあるか
- 「OBSテスト再生」でイベントが飛ぶか
- 自動再生制限: 一度ソースをインタラクト/更新

### セキュリティ

- OBS URL / トークンを配信画面や公開ログに出さない
- 漏えいしたら即座に再発行（旧トークン無効化）
- `service_role` / pepper をクライアントに置かない

## 再生の方針

サーバーに受理された `playback_events` を Realtime（Postgres Changes）で受信してから再生します。体感遅延はネットワーク次第ですが、重複・暴発を避けるためローカル先行再生はしません。

## 現在の制約

- MP3/OGG の厳密な再生時間はクライアント申告 + マジックバイト検証（WAV はサーバーで duration 推定）
- `toggle_loop`、押し続け再生は未対応（`one_shot` のみ）
- お気に入りは端末の localStorage のみ（アカウント同期なし）
- Playwright E2E はスモーク中心（実 DB 連携フローは手動検証）
- 実音声の CI 完全検証は未実施

## 今後の拡張候補

波形編集、ラウドネス正規化、Twitch/YouTube/Discord、Stripe、Stream Deck/MIDI、AI 効果音、公開素材マーケット

## 手動検証手順（要約）

1. ユーザーA: 登録 → 部屋作成 → サウンドアップロード（即時ボード反映）
2. ユーザーB or ゲスト: 招待URL参加 → 音声有効化 → ボタン押下
3. A/B 双方で一度だけ再生されること
4. OBS URL で同様に再生
5. 全停止が全員と OBS に効くこと
6. 無効トークンで OBS が拒否されること
7. 連打でクールダウン/レート制限が働くこと
