# LINE連携設定ガイド

## システムとLINEの関係

本システムは **2つのLINEプロダクト** を使用する。LINE Loginは単体では使わず、LIFFに内包されている。

| LINEプロダクト | 用途 | 使用箇所 |
|---|---|---|
| **LIFF** (LINE Front-end Framework) | LINEアプリ内でWebアプリを表示、ユーザー認証、プロフィール取得 | Frontend (`liff.ts`, `main.tsx`) |
| **LINE Login** (LIFF経由) | OAuth認証 — LIFF内部で自動処理、単体では使わない | Frontend (`liff.init()` 内部) |
| **Messaging API** | サロン→会員へのプッシュ通知 | Backend (`LineService::pushMessage()`) |

## 認証フロー

```
ユーザーがLINEアプリでLIFF URLを開く
        │
        ▼
┌─ Frontend ──────────────────────────────────────┐
│  liff.init({ liffId })                          │
│       │                                          │
│       ├── 未ログイン → liff.login()              │
│       │   (LINEが自動でOAuth処理)                │
│       │                                          │
│       ├── liff.getAccessToken()                  │
│       │   → LINE Access Token を取得             │
│       │                                          │
│       └── liff.getProfile()                      │
│           → { userId, displayName, pictureUrl }  │
└──────────────────────────────────────────────────┘
        │
        │  全APIリクエストに付与:
        │  Authorization: Bearer <LINE Access Token>
        ▼
┌─ Backend (LineAuthMiddleware) ───────────────────┐
│  1. Bearer トークンを取得                         │
│  2. LINE API /oauth2/v2.1/verify でトークン検証   │
│     → 有効期限 + channel_id 一致を確認            │
│  3. LINE API /v2/profile でプロフィール取得       │
│     → userId, displayName を取得                 │
│  4. line_user_id をリクエストに注入               │
│  5. コントローラーが line_user_id で会員を特定    │
└──────────────────────────────────────────────────┘
```

## プッシュ通知 (Messaging API)

```
Backend (LineService)
  POST https://api.line.me/v2/bot/message/push
  Authorization: Bearer <Channel Access Token>
  Body: { to: <line_user_id>, messages: [...] }
```

### 通知タイミング

| タイミング | トリガー | コード |
|---|---|---|
| 予約作成時 | 会員がAPI経由で予約 | `ReservationController::store()` |
| 予約確認時 | 管理者がステータス変更 | `AdminReservationController::updateStatus()` |
| 予約キャンセル時 | 管理者がステータス変更 | `AdminReservationController::updateStatus()` |
| メッセージ送信時 | 管理者がメッセージ送信 | `AdminMessageController::store()` |

## LINE Developers Console 設定手順

### 手順1: Providerを作成

LINE Developers Console (https://developers.line.biz/console/) でProviderを作成する。

### 手順2: LINE Loginチャネルを作成 (LIFF用)

1. Provider内で **LINE Login** チャネルを作成
2. App type: **Web app**
3. 取得する値:

| Console上の場所 | 環境変数 | 設定ファイル |
|---|---|---|
| Basic settings → **Channel ID** | `LINE_CHANNEL_ID` | `backend/laravel-app/.env` |
| Basic settings → **Channel secret** | `LINE_CHANNEL_SECRET` | `backend/laravel-app/.env` |

### 手順3: LIFFアプリを追加

1. LINE Loginチャネルの **LIFF** タブで追加
2. 設定値:

| 設定項目 | 値 |
|---|---|
| LIFFアプリ名 | Salon Reservation |
| サイズ | **Full** |
| エンドポイントURL | `https://your-domain.com` (本番) / `https://localhost:3000` (開発) |
| Scopes | **profile** (必須), openid |
| Bot link feature | **Aggressive** または **Normal** |

3. 取得する値:

| Console上の場所 | 環境変数 | 設定ファイル |
|---|---|---|
| LIFF tab → **LIFF ID** | `VITE_LIFF_ID` | `frontend/.env.local` |

**注意:** エンドポイントURLは **HTTPS** 必須。ローカル開発では `mkcert` で証明書を生成する:

```bash
mkcert localhost 127.0.0.1
# localhost+1.pem と localhost+1-key.pem が生成される
# → sys/frontend/ に配置 (vite.config.ts が自動検出)
```

### 手順4: Messaging APIチャネルを作成

1. **同じProvider内** で **Messaging API** チャネルを作成
2. LINE公式アカウントが自動作成される
3. Messaging APIタブで **チャネルアクセストークン(長期)** を発行

| Console上の場所 | 環境変数 | 設定ファイル |
|---|---|---|
| Messaging API tab → **Channel access token** | `LINE_CHANNEL_ACCESS_TOKEN` | `backend/laravel-app/.env` |

### 手順5: LIFFとMessaging APIをリンク

LIFF (LINE Login) チャネルとMessaging APIチャネルを**同じLINE公式アカウント**にリンクする。

1. LINE Loginチャネル → LIFFタブ → **Bot link feature** → Aggressive/Normal に設定
2. **Linked OA** で Messaging APIチャネルが作成した公式アカウントを選択

## 重要: 同じProvider内に作成すること

LINEの `userId` は **Provider単位** でユニーク。

```
同じProvider内:
├── LINE Login Channel → userId = "Uabc123"
└── Messaging API Channel → userId = "Uabc123"  ← 一致

別々のProvider:
Provider A └── LINE Login → userId = "Uabc123"
Provider B └── Messaging API → userId = "Uxyz789"  ← 不一致！
```

別Providerに作成した場合、LIFF認証は動作するが **Push通知が届かない** (userIdが一致しないため)。

## 設定ファイルまとめ

### Console構成図

```
LINE Developers Console
└── Provider: "Salon App"
    ├── LINE Login Channel
    │   ├── Channel ID ────────→ LINE_CHANNEL_ID        (backend/.env)
    │   ├── Channel secret ────→ LINE_CHANNEL_SECRET     (backend/.env)
    │   └── LIFF App
    │       ├── LIFF ID ───────→ VITE_LIFF_ID            (frontend/.env.local)
    │       ├── Endpoint URL: https://your-domain
    │       ├── Scopes: profile
    │       └── Bot link → 下記の公式アカウントにリンク
    │
    └── Messaging API Channel
        ├── Channel access token
        │   └──→ LINE_CHANNEL_ACCESS_TOKEN               (backend/.env)
        └── LINE公式アカウント ← 上記LIFFからリンク
```

### backend/laravel-app/.env

```env
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=abcdef1234567890abcdef1234567890
LINE_CHANNEL_ACCESS_TOKEN=eyJhbGciOi...
```

### frontend/.env.local

```env
VITE_LIFF_ID=1234567890-abcdefgh
VITE_API_BASE_URL=http://localhost:3002/api
```

## 開発用バイパス

`APP_DEBUG=true` 環境では以下のトークンでLINE認証をスキップできる:

| トークン | 用途 |
|---|---|
| `dev_test_token` | 会員向けAPI (LINE認証スキップ) |
| `dev_admin_token` | 管理者向けAPI (管理者認証スキップ) |
