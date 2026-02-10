# Salon Reservation System

LINE LIFF ベースのサロン予約アプリケーション。お客様はLINEアプリ内でサービスの閲覧・予約・メッセージの送受信が可能。管理者は管理画面から予約・スタッフ・メニューを管理できます。

## 技術スタック

| レイヤー | 技術 |
|---------|------|
| バックエンド | Laravel 12 / PHP 8.2 |
| フロントエンド | React 19 + TypeScript + Vite 7 |
| データベース | MySQL 8.0 |
| 認証 (会員) | LINE LIFF SDK |
| 認証 (管理) | Bearer トークン + TOTP 二要素認証 |
| インフラ | Docker Compose |
| LINE連携 | Messaging API (プッシュ通知) |

## ディレクトリ構成

```
sys/
├── backend/
│   ├── docker-compose.yml
│   ├── docker/
│   │   ├── nginx/default.conf
│   │   └── php/Dockerfile
│   └── laravel-app/
│       ├── app/
│       │   ├── Http/
│       │   │   ├── Controllers/        # 会員向け API
│       │   │   │   ├── MemberController.php
│       │   │   │   ├── ServiceController.php
│       │   │   │   ├── StaffController.php
│       │   │   │   ├── ReservationController.php
│       │   │   │   └── MessageController.php
│       │   │   ├── Controllers/Admin/   # 管理者向け API
│       │   │   │   ├── AdminAuthController.php
│       │   │   │   ├── AdminDashboardController.php
│       │   │   │   ├── AdminReservationController.php
│       │   │   │   ├── AdminServiceController.php
│       │   │   │   ├── AdminStaffController.php
│       │   │   │   ├── AdminMemberController.php
│       │   │   │   ├── AdminMessageController.php
│       │   │   │   ├── AdminSettingsController.php
│       │   │   │   └── AdminTwoFactorController.php
│       │   │   └── Middleware/
│       │   │       ├── LineAuthMiddleware.php
│       │   │       ├── AdminAuthMiddleware.php
│       │   │       ├── AdminRoleMiddleware.php
│       │   │       └── SecurityHeadersMiddleware.php
│       │   ├── Models/                  # 9 モデル
│       │   └── Services/
│       │       ├── LineService.php      # LINE API 連携
│       │       └── AvailabilityService.php  # 空き時間算出
│       ├── database/migrations/         # 9 テーブル
│       ├── database/seeders/            # サンプルデータ
│       └── routes/api.php
└── frontend/
    └── src/
        ├── main.tsx                     # LIFF初期化 (adminパスはスキップ)
        ├── App.tsx                      # ルーティング
        ├── index.css                    # グローバルスタイル
        ├── pages/                       # 会員向けページ (7画面)
        ├── components/                  # 共通コンポーネント (7個)
        ├── services/                    # API クライアント
        ├── hooks/                       # カスタムフック
        ├── types/                       # TypeScript 型定義
        └── admin/                       # 管理画面
            ├── pages/                   # 管理ページ (9画面)
            ├── components/              # 管理コンポーネント
            ├── contexts/                # 認証コンテキスト
            ├── services/adminApi.ts     # 管理 API クライアント
            ├── layouts/AdminLayout.tsx
            ├── types/
            ├── hooks/
            └── styles/admin.css
```

## セットアップ

### 必要環境

- Docker & Docker Compose
- Node.js 18+

### バックエンド起動

```bash
cd backend

# コンテナをビルド・起動
docker compose up -d

# マイグレーション実行
docker exec salon-reservation-app php artisan migrate --force

# シードデータ投入
docker exec salon-reservation-app php artisan db:seed --force
```

起動後のポート:

| サービス | URL |
|---------|-----|
| API | http://localhost:3002/api |
| Adminer (DB管理) | http://localhost:8082 |
| MySQL | localhost:3307 |

### フロントエンド起動

```bash
cd frontend

# 依存パッケージをインストール
npm install

# 開発サーバー起動
npm run dev
```

フロントエンド: http://localhost:3000

### 環境変数

**バックエンド** (`backend/laravel-app/.env`):

```
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_channel_access_token
```

**フロントエンド** (`frontend/.env.local`):

```
VITE_LIFF_ID=your_liff_id
VITE_API_BASE_URL=http://localhost:3002/api
```

## 開発用トークン

`APP_DEBUG=true` の環境では以下のトークンで認証をバイパスできます:

| トークン | 用途 |
|---------|------|
| `dev_test_token` | 会員向け API (LINE認証スキップ) |
| `dev_admin_token` | 管理者向け API (管理者認証スキップ) |

```bash
# 会員 API テスト
curl http://localhost:3002/api/services \
  -H "Authorization: Bearer dev_test_token"

# 管理者 API テスト
curl http://localhost:3002/api/admin/dashboard \
  -H "Authorization: Bearer dev_admin_token"
```

## シードデータ

| データ | 内容 |
|-------|------|
| 管理者 | admin / admin123 (role: admin) |
| スタッフ | tanaka / staff123 (田中 美咲 - カット・カラー) |
| スタッフ | suzuki / staff123 (鈴木 健太 - パーマ・トリートメント) |
| メニュー | カット (60分/¥4,500)、カラー (90分/¥7,000)、パーマ (120分/¥8,500)、トリートメント (45分/¥3,500)、ヘッドスパ (30分/¥3,000) |
| スケジュール | 月〜土 10:00-19:00 / 日曜定休 |

## データベース

### ER図 (テーブル一覧)

```
members              -- LINE会員
admin_users          -- 管理者・スタッフ (role: admin/staff)
admin_tokens         -- 管理者認証トークン (2FA対応)
services             -- サロンメニュー
staff_services       -- スタッフ × メニュー (多対多)
staff_schedules      -- 週間スケジュール (曜日ごと)
staff_schedule_exceptions -- 日付指定の休日・例外
reservations         -- 予約 (status: pending/confirmed/in_progress/completed/cancelled/no_show)
messages             -- 会員 ↔ サロン メッセージ
```

全テーブルで UUID を主キーとして使用。

## API エンドポイント

### 会員向け (LINE認証)

| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/member` | 会員情報取得 |
| POST | `/api/member/register` | 会員登録 |
| GET | `/api/services` | メニュー一覧 |
| GET | `/api/staff` | スタッフ一覧 (?service_id でフィルタ) |
| GET | `/api/staff/{id}/availability` | 空き時間取得 (?date, ?service_id) |
| POST | `/api/reservations` | 予約作成 |
| GET | `/api/reservations` | 予約一覧 (?status=upcoming/past) |
| GET | `/api/reservations/{id}` | 予約詳細 |
| POST | `/api/reservations/{id}/cancel` | 予約キャンセル |
| GET | `/api/messages` | メッセージ一覧 |
| POST | `/api/messages` | メッセージ送信 |

### 管理者向け

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/admin/login` | ログイン |
| POST | `/api/admin/2fa/verify` | 2FA検証 |
| POST | `/api/admin/logout` | ログアウト |
| GET | `/api/admin/me` | ログインユーザー情報 |
| GET | `/api/admin/dashboard` | ダッシュボード統計 |
| GET | `/api/admin/reservations` | 予約一覧 (フィルタ対応) |
| GET | `/api/admin/reservations/{id}` | 予約詳細 |
| PUT | `/api/admin/reservations/{id}/status` | 予約ステータス変更 |
| GET/POST | `/api/admin/services` | メニュー一覧・作成 |
| PUT/DELETE | `/api/admin/services/{id}` | メニュー更新・削除 |
| GET | `/api/admin/staff` | スタッフ一覧 |
| GET | `/api/admin/staff/{id}` | スタッフ詳細 |
| PUT | `/api/admin/staff/{id}/profile` | プロフィール更新 |
| GET/PUT | `/api/admin/staff/{id}/schedule` | スケジュール取得・更新 |
| POST | `/api/admin/staff/{id}/exceptions` | 休日追加 |
| DELETE | `/api/admin/staff/{id}/exceptions/{eid}` | 休日削除 |
| GET | `/api/admin/members` | 会員一覧 |
| GET | `/api/admin/members/{id}` | 会員詳細 |
| POST | `/api/admin/messages` | メッセージ送信 (LINE push対応) |
| GET | `/api/admin/messages/{memberId}` | メッセージ履歴 |

### 管理者専用 (role: admin のみ)

| Method | Path | 説明 |
|--------|------|------|
| GET/PUT | `/api/admin/settings` | アプリ設定 |
| CRUD | `/api/admin/operators` | スタッフアカウント管理 |
| GET/POST/DELETE | `/api/admin/2fa/*` | 二要素認証管理 |

## 画面一覧

### 会員向け (LIFF)

| パス | 画面 | 機能 |
|------|------|------|
| `/` | ホーム | 今後の予約表示、クイックアクション |
| `/services` | メニュー | サロンメニュー一覧、料金・時間表示 |
| `/reserve` | 予約 | 4ステップウィザード (メニュー → スタッフ → 日時 → 確認) |
| `/reservations` | 予約履歴 | 今後/過去の予約をタブで切替 |
| `/reservations/:id` | 予約詳細 | 詳細表示・キャンセル |
| `/messages` | メッセージ | チャット形式のメッセージ送受信 |
| `/profile` | プロフィール | 会員情報・ログアウト |

### 管理画面

| パス | 画面 | 機能 |
|------|------|------|
| `/admin/login` | ログイン | ID/PW + 2FA対応 |
| `/admin` | ダッシュボード | 統計・本日のスケジュール |
| `/admin/reservations` | 予約管理 | 日付/ステータスフィルタ、ステータス変更 |
| `/admin/services` | メニュー管理 | CRUD操作 |
| `/admin/staff` | スタッフ一覧 | スタッフ管理 |
| `/admin/staff/:id` | スタッフ詳細 | プロフィール/スケジュール/休日設定 |
| `/admin/members` | 会員管理 | 検索・一覧 |
| `/admin/members/:id` | 会員詳細 | 情報/予約履歴/メッセージ送信 |
| `/admin/settings` | 設定 | 2FA設定・スタッフアカウント管理 |

## 予約フロー

```
1. 会員がメニューを選択
2. 対応可能なスタッフを選択
3. カレンダーから日付を選択
4. AvailabilityService が空き時間を算出:
   - スタッフの週間スケジュールを取得
   - 日付指定の例外（休日等）をチェック
   - 既存予約との重複を排除
   - サービスの所要時間で30分刻みにスロット生成
5. 空き時間から選択
6. 確認画面で内容を確認し予約確定
7. DB トランザクション + lockForUpdate で二重予約を防止
8. LINE プッシュ通知で会員に予約受付を通知
```

## LINE 通知

以下のタイミングで LINE Messaging API 経由のプッシュ通知を送信:

- 予約作成時（会員へ予約受付通知）
- 予約確認時（管理者が確認 → 会員へ通知）
- 予約キャンセル時（管理者がキャンセル → 会員へ通知）
- サロンからメッセージ送信時（管理画面から会員へ）
