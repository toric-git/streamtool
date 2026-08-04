# Phase 2 セットアップ手順（人間が行う作業）

## 1. Supabase プロジェクト作成

1. https://supabase.com で新規プロジェクトを作成
2. Project Settings → API から以下を控える
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`（サーバーのみ）

## 2. 環境変数

```bash
cp .env.example .env.local
```

`.env.local` を編集し、上記キーと `OBS_TOKEN_PEPPER`（例: `openssl rand -hex 32`）を設定。

## 3. Auth 設定（Dashboard）

- Authentication → Providers → Email：有効
- Authentication → Providers → Anonymous Sign-Ins：有効（ゲスト参加に必須）
- （任意）Google：有効化し Client ID / Secret を設定
  - Redirect URL: `https://<YOUR_PROJECT_REF>.supabase.co/auth/v1/callback`
  - アプリ側 callback: `http://localhost:3000/auth/callback`（本番は `NEXT_PUBLIC_APP_URL/auth/callback`）
- Authentication → URL Configuration
  - Site URL: `http://localhost:3000`
  - Redirect URLs に `http://localhost:3000/auth/callback` を追加

## 4. Migration 適用

### 方法 A: SQL Editor

1. Dashboard → SQL Editor
2. 次を順に実行
   - `supabase/migrations/20260803220000_init.sql`
   - `supabase/migrations/20260804120000_member_management.sql`
   - `supabase/migrations/20260804130000_ownership_transfer.sql`

### 方法 B: Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <YOUR_PROJECT_REF>
npx supabase db push
```

## 5. Realtime

migration 内で `playback_events` / `room_members` / `sounds` を publication に追加済み。
Dashboard → Database → Publications で `supabase_realtime` に含まれていることを確認。

## 6. Storage

migration が `room-audio` / `room-images` バケットと RLS policy を作成。
Dashboard → Storage で private バケットとして存在することを確認。

## 7. ローカル起動

```bash
npm install
npm run dev
```

http://localhost:3000 → ログイン → `/dashboard` まで到達できれば Phase 2 の認証は成功です。
