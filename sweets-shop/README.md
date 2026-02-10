# Sweets Shop - LINE LIFF App

スイーツショップ向けのLINE LIFFアプリケーション。商品ギャラリー、QRコードによるポイント付与・利用、レビューチケット発行、管理画面を提供します。

## 技術スタック

| 層          | 技術                                       |
| ----------- | ------------------------------------------ |
| Backend     | Laravel 12 / PHP 8.2 / MySQL 8.0           |
| Frontend    | React 19 / TypeScript 5.9 / Vite 7         |
| 認証 (会員) | LINE LIFF SDK                              |
| 認証 (管理) | Bearer Token + TOTP 2FA                    |
| QRスキャン  | html5-qrcode                               |
| QR生成      | qrcode (npm)                               |
| インフラ    | Docker (PHP-FPM + Nginx + MySQL + Adminer) |

## ディレクトリ構成

```
sweets-shop/
├── sys/
│   ├── backend/
│   │   ├── docker-compose.yml
│   │   ├── docker/
│   │   │   ├── php/          # Dockerfile, entrypoint.sh
│   │   │   └── nginx/        # default.conf
│   │   └── laravel-app/      # Laravel 12 プロジェクト
│   └── frontend/             # React + Vite プロジェクト
│       ├── src/
│       │   ├── pages/        # 会員向けページ (10ファイル)
│       │   ├── components/   # Header, Navigation
│       │   ├── services/     # api.ts, liff.ts
│       │   ├── types/        # TypeScript型定義
│       │   └── admin/        # 管理画面
│       │       ├── pages/    # 管理ページ (13ファイル)
│       │       ├── contexts/ # AdminAuthContext
│       │       ├── components/
│       │       ├── layouts/
│       │       ├── services/ # adminApi.ts
│       │       ├── types/
│       │       └── styles/
│       └── .env.local
└── doc/
```

## セットアップ

### 1. バックエンド起動

```bash
cd sys/backend
docker-compose up -d
```

コンテナ起動後、マイグレーションとシーダーを実行:

```bash
docker exec sweets-shop-app php artisan migrate
docker exec sweets-shop-app php artisan db:seed
docker exec sweets-shop-app php artisan storage:link
```

### 2. フロントエンド起動

```bash
cd sys/frontend
npm install
npm run dev
```

### 3. アクセス先

| サービス         | URL                         |
| ---------------- | --------------------------- |
| 会員アプリ       | http://localhost:3000       |
| 管理画面         | http://localhost:3000/admin |
| API              | http://localhost:3003/api   |
| Adminer (DB管理) | http://localhost:8083       |

## ポート一覧

| ポート | サービス                    |
| ------ | --------------------------- |
| 3000   | Vite開発サーバー (Frontend) |
| 3003   | Nginx (Backend API)         |
| 3308   | MySQL                       |
| 8083   | Adminer                     |

## 管理画面ログイン

## 開発用トークン

LINE認証なしでAPIをテストする場合:

```bash
# 会員API (LINE認証バイパス)
curl -H "Authorization: Bearer dev_test_token" http://localhost:3003/api/member

# 管理API (管理者認証バイパス)
curl -H "Authorization: Bearer dev_admin_token" http://localhost:3003/api/admin/dashboard
```

## 主要機能

### 会員向け (LINE LIFF)

- **ホーム** - ポイント残高、クイックアクション、お知らせ
- **ギャラリー** - カテゴリ別の商品一覧、商品詳細
- **ポイント獲得** - QRスキャンでポイント付与
- **ポイント利用** - QRスキャンでポイント消費
- **レビューチケット** - QRスキャンでチケット取得 → レビュー投稿
- **ポイント履歴** - 取引履歴の確認
- **マイページ** - プロフィール、レビュー一覧

### 管理画面

- **ダッシュボード** - 統計サマリー、最近の取引
- **カテゴリ管理** - CRUD (画像アップロード対応)
- **商品管理** - CRUD (画像アップロード対応)
- **在庫管理** - インライン編集
- **お知らせ管理** - CRUD、公開/非公開切替
- **会員管理** - 一覧、詳細 (取引・レビュー履歴)
- **ポイント取引** - 一覧、フィルター
- **レビューチケット** - 発行状況確認
- **レビュー管理** - 表示/非表示切替
- **QRコード生成** - ポイント付与/利用/レビューチケット用QR生成
- **設定** - 2FA設定、オペレーター管理 (管理者のみ)

## QRコードフロー

```
[管理画面] QRコード生成 (種別・ポイント数指定)
    ↓
[会員アプリ] QRスキャン
    ↓
[API] QRトークン検証 → ポイント付与/利用 or チケット発行
    ↓
[LINE] プッシュ通知送信
```

## API エンドポイント

### 公開 (認証不要)

| Method | Path                | 説明           |
| ------ | ------------------- | -------------- |
| GET    | /api/health         | ヘルスチェック |
| GET    | /api/categories     | カテゴリ一覧   |
| GET    | /api/categories/:id | カテゴリ詳細   |
| GET    | /api/items          | 商品一覧       |
| GET    | /api/items/:id      | 商品詳細       |
| GET    | /api/news           | お知らせ一覧   |
| GET    | /api/news/:id       | お知らせ詳細   |

### 会員 (LINE認証)

| Method | Path                     | 説明                      |
| ------ | ------------------------ | ------------------------- |
| GET    | /api/member              | 会員情報取得              |
| POST   | /api/member              | 会員登録                  |
| GET    | /api/points/balance      | ポイント残高              |
| GET    | /api/points/transactions | ポイント取引履歴          |
| POST   | /api/qr/earn             | ポイント獲得 (QR)         |
| POST   | /api/qr/spend            | ポイント利用 (QR)         |
| POST   | /api/qr/review-ticket    | レビューチケット取得 (QR) |
| GET    | /api/review-tickets      | チケット一覧              |
| POST   | /api/reviews             | レビュー投稿              |
| GET    | /api/reviews/mine        | 自分のレビュー            |

### 管理 (管理者認証)

| Method          | Path                              | 説明                 |
| --------------- | --------------------------------- | -------------------- |
| POST            | /api/admin/login                  | ログイン             |
| POST            | /api/admin/2fa/verify             | 2FA検証              |
| POST            | /api/admin/logout                 | ログアウト           |
| GET             | /api/admin/me                     | ログインユーザー情報 |
| GET             | /api/admin/dashboard              | ダッシュボード統計   |
| GET/POST/DELETE | /api/admin/categories[/:id]       | カテゴリCRUD         |
| GET/POST/DELETE | /api/admin/items[/:id]            | 商品CRUD             |
| PUT             | /api/admin/items/:id/stock        | 在庫更新             |
| GET/POST/DELETE | /api/admin/news[/:id]             | お知らせCRUD         |
| GET             | /api/admin/members[/:id]          | 会員一覧/詳細        |
| GET             | /api/admin/point-transactions     | ポイント取引一覧     |
| GET             | /api/admin/review-tickets         | チケット一覧         |
| GET             | /api/admin/reviews                | レビュー一覧         |
| PUT             | /api/admin/reviews/:id/visibility | レビュー表示切替     |
| POST            | /api/admin/qr/generate            | QRコード生成         |
| GET             | /api/admin/qr/active              | 有効QR一覧           |

## データベース

| テーブル           | 説明                          |
| ------------------ | ----------------------------- |
| members            | 会員 (LINE連携、ポイント残高) |
| admin_users        | 管理ユーザー (admin/staff)    |
| admin_tokens       | 認証トークン                  |
| sweets_categories  | カテゴリ                      |
| sweets_items       | 商品                          |
| point_transactions | ポイント取引履歴              |
| qr_codes           | QRコード (30分有効)           |
| review_tickets     | レビューチケット              |
| reviews            | レビュー (1-5星)              |
| shop_news          | お知らせ                      |

## LINE連携設定

本番環境で利用する場合、以下の環境変数を設定してください:

**バックエンド** (`sys/backend/laravel-app/.env`):

```
LINE_CHANNEL_ID=your_channel_id
LINE_CHANNEL_SECRET=your_channel_secret
LINE_CHANNEL_ACCESS_TOKEN=your_access_token
```

**フロントエンド** (`sys/frontend/.env.local`):

```
VITE_LIFF_ID=your_liff_id
VITE_API_BASE_URL=https://your-domain.com/api
```
