# Streamtool

VTuber向け配信ツールハブです。現在利用可能なツールはリアルタイムサウンドボードで、コメント読み上げ・字幕翻訳などを順次追加予定です。

サウンドボードでは、部屋の参加者が効果音ボタンを押すと、同室の全員のブラウザで同じ音が再生されます。配信では OBS のアプリケーション音声キャプチャでボードの音を取り込みます。

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
| `SUPABASE_SERVICE_ROLE_KEY` | **サーバーのみ**。用途: パスワード付き参加、Storage削除、特権処理 |

## Supabase セットアップ

詳細は `docs/SETUP_PHASE2.md` も参照。

1. プロジェクト作成
2. Authentication
   - Email 有効
   - **Anonymous Sign-Ins 有効**（ゲスト参加に必須）
   - （任意）Google OAuth
   - Redirect URLs に `http://localhost:3000/auth/callback`
3. SQL Editor で `supabase/migrations/` 配下をタイムスタンプ順にすべて実行
   （または `npx supabase db push`）
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
4. （任意）`APP_ADMIN_EMAILS` に運用者メールを設定 → `/admin/feedback` で要望・バグを確認
5. 利用規約 `/terms`・プライバシー `/privacy` を公開前に内容確認

## フィードバック運用

- 利用者はヘッダー「ご要望・バグ報告」から送信
- 送信は 1時間あたり最大5件 / 1日あたり最大20件（ユーザーまたはIPハッシュ単位）
- 運用者は `APP_ADMIN_EMAILS` に自分のメールを入れ、`/admin/feedback` で未対応→対応済みを管理
- DB migration `20260810160000_feedback_reports.sql` と `20260810180000_feedback_ops_rate_limit.sql` が必要

## OBSでの使い方（アプリケーション音声キャプチャ）

1. 配信PCで部屋のサウンドボードを開き、音が出る状態にする
2. OBS → ソース → **アプリケーション音声キャプチャ（NEW）** を追加
3. キャプチャ対象に、ボードを開いているブラウザを選ぶ
4. ボードで効果音を再生し、OBSミキサーで音量を調整

詳細はオーナー設定内の「OBSでの使い方」も参照。

## 再生の方針

押した端末ではローカル先行再生し、他メンバーはサーバー受理後の `playback_events` を Realtime（Postgres Changes）で受信して再生します。配信音声はボードを開いているブラウザの再生音を OBS でキャプチャします。

## 現在の制約

- MP3/OGG の厳密な再生時間はクライアント申告 + マジックバイト検証（WAV はサーバーで duration 推定）
- `toggle_loop` は押し続け再生（pointer / キー押し続け）に対応
- お気に入りはアカウント同期（`sound_favorites`）+ 端末キャッシュ
- Playwright E2E はスモーク中心（実 DB の招待→再生は `E2E_LIVE=1` で拡張予定）
- GitHub Actions で typecheck / unit / lint / e2e smoke を実行

## 今後の拡張候補

波形編集、ラウドネス正規化、Twitch/YouTube/Discord、Stripe、Stream Deck/MIDI、AI 効果音、公開素材マーケット

## 手動検証手順（要約）

1. ユーザーA: 登録 → 部屋作成 → サウンドアップロード（即時ボード反映）
2. ユーザーB or ゲスト: 招待URL参加 → 音声有効化 → ボタン押下
3. A/B 双方で一度だけ再生されること
4. OBS のアプリ音声キャプチャでボードの音が入ること
5. 全停止が全員に効くこと
7. 連打でクールダウン/レート制限が働くこと
