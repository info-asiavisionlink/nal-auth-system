# NAL Auth System

Next.js 16（App Router）+ TypeScript + Tailwind CSS + Supabase による本番向け認証・クレジット管理アプリです。

## 機能

- メール / パスワード認証（Supabase Auth）
- `profiles` テーブルによるユーザー名・クレジット管理
- `/dashboard` のミドルウェア保護
- n8n Webhook 経由の Stripe Checkout 連携

## フォルダ構成

```
nal-auth-system/
├── middleware.ts              # /dashboard 認証ガード
├── supabase/
│   └── schema.sql             # DB・RLS 定義
├── src/
│   ├── app/
│   │   ├── api/checkout/      # 決済 Webhook プロキシ
│   │   ├── auth/callback/     # メール認証コールバック
│   │   ├── dashboard/
│   │   ├── login/
│   │   ├── signup/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   └── ui/
│   ├── lib/
│   │   ├── supabase.ts        # ブラウザ用クライアント
│   │   ├── supabase-server.ts # サーバー用クライアント
│   │   ├── supabase-admin.ts  # service_role（サーバーのみ）
│   │   ├── auth-errors.ts
│   │   └── constants.ts
│   └── types/
│       └── database.ts
├── .env.example
└── .env.local                 # ローカル専用（Git に含めない）
```

## セットアップ

### 1. 依存関係

```bash
npm install
```

### 2. 環境変数

`.env.example` を `.env.local` にコピーし、値を設定します。

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 公開（Publishable）キー |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role（サーバーのみ・クライアント禁止） |
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | n8n Webhook URL |

### 3. Supabase SQL

Supabase Dashboard → SQL Editor で `supabase/schema.sql` を実行してください。

**Auth 設定（推奨）**

- Authentication → URL Configuration  
  - Site URL: `http://localhost:3000`（本番はデプロイ URL）
  - Redirect URLs: `http://localhost:3000/auth/callback`
- メール確認を有効にする場合、サインアップ後はメール認証完了までダッシュボードに入れません。

### 4. 起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

| コマンド | 用途 |
|----------|------|
| `npm run dev` | 開発サーバー |
| `npm run build` | 本番ビルド |
| `npm run start` | 本番サーバー起動 |
| `npm run lint` | ESLint |

## n8n / Stripe 連携

`POST /api/checkout` が認証済みユーザーのみ n8n に以下を送信します。

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "addCredit": 1500,
  "amount": 3000
}
```

n8n は JSON で `checkoutUrl`（または `url`）を返す想定です。

## セキュリティ

- `SUPABASE_SERVICE_ROLE_KEY` はサーバー専用（`supabase-admin.ts`）。クライアントから import しないこと。
- API キー・秘密鍵は UI に表示しません。
- パスワードの「確認する」は、同一ブラウザのログイン直後のみ `sessionStorage` に保持した値を表示します（Supabase から平文パスワードは取得不可）。

## GitHub へ push

```bash
git init
git add .
git commit -m "feat: add production auth system with Supabase"
git branch -M main
git remote add origin https://github.com/YOUR_USER/nal-auth-system.git
git push -u origin main
```

## 本番デプロイ（Vercel 等）

1. リポジトリを Vercel に接続
2. 環境変数を **Production / Preview** それぞれ設定（`.env.local` はアップロードしない）
3. Supabase の Site URL / Redirect URLs を本番ドメインに更新
4. `npm run build` が CI で成功することを確認
5. RLS が有効なことを再確認（`schema.sql`）

## ライセンス

Private
