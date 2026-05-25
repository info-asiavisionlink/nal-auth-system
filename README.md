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
│   │   ├── api/credits/       # 残高・消費 API
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
| `GOOGLE_SHEETS_API_KEY` | Google Sheets API キー（サーバーのみ） |
| `GOOGLE_SHEET_ID` | システム一覧スプレッドシート ID |

### 3. Supabase SQL

Supabase Dashboard → SQL Editor で `supabase/schema.sql` を実行してください。

**Auth 設定（メール認証・必須）**

Supabase Dashboard で以下を設定してください。

1. **Confirm email を ON**  
   - Authentication → Sign In / Providers → **Email** → **Confirm email** を ON

2. **URL Configuration**  
   - Authentication → URL Configuration  
   - **Site URL**: 本番 URL（開発時は `http://localhost:3000`）  
   - **Redirect URLs** に以下を追加:
     - `http://localhost:3000/auth/callback`
     - `https://あなたの本番ドメイン/auth/callback`

3. **フロー概要**  
   - 新規登録後、確認メールのリンクをクリック → `/auth/callback` → `/login?verified=1`  
   - メール認証完了後にログイン → `/dashboard`  
   - メール未認証のユーザーは `/dashboard` に入れません

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

## クレジット API（外部ツール連携）

消費クレジットは **`tools` テーブル**で管理します。  
**`credit_cost` をツール側から送らないでください**（送っても無視します）。  
サーバーが `tool_key` から `tools.credit_cost` を取得して減算します。

ダッシュボードの「ツールを開く」ではクレジットは減りません。  
各ツールは**処理実行直前**にのみ API を呼び出してください。

### Supabase SQL（必須）

Supabase SQL Editor で **`supabase/credits-schema.sql`** を実行してください。

- `tools` テーブル（`google_map_leads` 初期データ含む）
- `tool_usage_logs` 拡張（`external_request_id` 等）
- `consume_credit_by_tool_key` RPC

### 正規エンドポイント

#### `GET /api/credits/balance`

ログイン中ユーザーの残高。

```json
{ "status": "success", "credit": 120 }
```

#### `POST /api/credits/consume`

```json
{
  "tool_key": "google_map_leads",
  "external_request_id": "google-map側のsearch_request_id"
}
```

成功:

```json
{
  "status": "success",
  "tool_key": "google_map_leads",
  "credit_cost": 30,
  "credit_before": 120,
  "credit_after": 90
}
```

残高不足（402）:

```json
{
  "status": "insufficient_credit",
  "message": "クレジットが不足しています。",
  "required_credit": 30,
  "current_credit": 10
}
```

### Googleマップツール側の呼び出し例

```javascript
const DASHBOARD_ORIGIN = "https://あなたの共通ダッシュボードURL";

const consumeRes = await fetch(`${DASHBOARD_ORIGIN}/api/credits/consume`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  credentials: "include",
  body: JSON.stringify({
    tool_key: "google_map_leads",
    external_request_id: searchRequestId,
  }),
});

const result = await consumeRes.json();

if (result.status === "success") {
  await runGoogleMapSearch();
} else {
  alert(result.message);
}
```

`credentials: "include"` で Supabase Auth のセッション Cookie を送信します。  
**パスワード・service_role キーは送らないでください。**

### 互換エンドポイント

`POST /api/tools/consume-credit` は互換用です。内部で `/api/credits/consume` と同じ処理を行います。  
新規実装は `/api/credits/consume` を使用してください。

### 改ざん防止

| 項目 | 方針 |
|------|------|
| `credit_cost` | クライアントから受け取らない。`tools` テーブルのみ信頼 |
| `tool_key` | ツール側が送信。サーバーで `tools` を検索 |
| 減算 | `consume_credit_by_tool_key` RPC（`FOR UPDATE` + 条件付き UPDATE） |
| 二重消費 | `external_request_id` がある場合、同一 user + tool_key + id の成功履歴を拒否 |

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
