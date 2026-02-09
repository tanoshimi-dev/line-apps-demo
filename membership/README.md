# LINE Membership App

A full-featured membership management system built with **LINE LIFF** (LINE Front-end Framework) for user-facing features and a **web-based admin panel** for store operators. Supports digital membership cards, point management, and QR code-based point earning/spending flows.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENTS                                    │
│                                                                     │
│   ┌───────────────────────┐       ┌───────────────────────────┐    │
│   │   LINE App (LIFF)     │       │   Admin SPA (Browser)     │    │
│   │                       │       │                           │    │
│   │  React 18 + TypeScript│       │  React 18 + TypeScript    │    │
│   │  LIFF SDK             │       │  localStorage token auth  │    │
│   │  html5-qrcode         │       │  Desktop-oriented UI      │    │
│   │  Mobile-first (480px) │       │  Sidebar layout           │    │
│   │                       │       │                           │    │
│   │  Routes: /            │       │  Routes: /admin/*         │    │
│   │    /card, /points     │       │    /admin/login           │    │
│   │    /profile, /scan    │       │    /admin/members         │    │
│   └──────────┬────────────┘       │    /admin/transactions    │    │
│              │                    │    /admin/qr/spend        │    │
│              │                    │    /admin/qr/earn         │    │
│              │                    │    /admin/settings        │    │
│              │                    └────────────┬──────────────┘    │
│              │                                 │                   │
└──────────────┼─────────────────────────────────┼───────────────────┘
               │ HTTPS                           │ HTTPS
               │ Bearer: LINE Access Token       │ Bearer: Admin Token
               ▼                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       BACKEND (Laravel 12)                          │
│                                                                     │
│   ┌────────────────────┐      ┌──────────────────────────┐         │
│   │  LineAuthMiddleware │      │  AdminAuthMiddleware     │         │
│   │  (LINE token verify)│      │  (Bearer token / dev     │         │
│   │                    │      │   bypass: dev_admin_token)│         │
│   └────────┬───────────┘      └──────────┬───────────────┘         │
│            │                             │                          │
│            ▼                             ▼                          │
│   ┌────────────────────┐      ┌──────────────────────────┐         │
│   │  /api/member/*     │      │  /api/admin/*            │         │
│   │  /api/points/*     │      │  AdminRoleMiddleware     │         │
│   │  /api/qr/*         │      │  (admin vs operator)     │         │
│   └────────┬───────────┘      └──────────┬───────────────┘         │
│            │                             │                          │
│            └──────────┬──────────────────┘                          │
│                       ▼                                             │
│            ┌─────────────────────┐                                  │
│            │   MySQL Database    │                                  │
│            │                     │                                  │
│            │  members            │                                  │
│            │  point_histories    │                                  │
│            │  admin_users        │                                  │
│            │  admin_tokens       │                                  │
│            │  qr_sessions        │                                  │
│            └─────────────────────┘                                  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, TypeScript, Vite 5, React Router v6 |
| **LINE SDK** | LIFF SDK 2.24, html5-qrcode |
| **Backend** | Laravel 12, PHP 8.2 |
| **Database** | MySQL (UUID primary keys) |
| **Infrastructure** | Docker (nginx + PHP-FPM), HTTPS (required by LIFF) |

---

## Database Schema

```
┌──────────────────┐       ┌──────────────────────┐
│   admin_users    │       │     admin_tokens      │
├──────────────────┤       ├──────────────────────┤
│ id (UUID) PK     │──┐    │ id (UUID) PK         │
│ username UNIQUE  │  │    │ admin_user_id FK     │──→ admin_users.id
│ password         │  │    │ token (64) UNIQUE    │
│ name             │  │    │ expires_at           │
│ role (admin/     │  │    │ timestamps           │
│      operator)   │  │    └──────────────────────┘
│ is_active        │  │
│ timestamps       │  │    ┌──────────────────────┐
└──────────────────┘  │    │     qr_sessions       │
                      │    ├──────────────────────┤
                      ├───→│ id (UUID) PK         │
                           │ admin_user_id FK     │
                           │ type (spend/earn)    │
┌──────────────────┐       │ points (nullable)    │
│     members      │       │ token (64) UNIQUE    │
├──────────────────┤       │ status (pending/     │
│ id (UUID) PK     │──┐    │   completed/expired) │
│ line_user_id     │  ├───→│ member_id FK         │
│   UNIQUE         │  │    │ reason               │
│ display_name     │  │    │ expires_at           │
│ member_number    │  │    │ timestamps           │
│   UNIQUE         │  │    └──────────────────────┘
│ points           │  │
│ rank (bronze/    │  │    ┌──────────────────────┐
│   silver/gold/   │  │    │   point_histories     │
│   platinum)      │  │    ├──────────────────────┤
│ picture_url      │  │    │ id (UUID) PK         │
│ timestamps       │  ├───→│ member_id FK         │
└──────────────────┘       │ type (add/use)       │
                           │ points               │
                           │ balance              │
                           │ reason               │
                           │ qr_session_id FK     │──→ qr_sessions.id
                           │ created_at           │
                           └──────────────────────┘
```

---

## User (Member) Features & Flow

### Registration & Authentication

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────┐
│ Open LIFF │────→│ LINE     │────→│ LIFF SDK     │────→│ App Home │
│ URL       │     │ Login    │     │ init + token │     │ (/)      │
└──────────┘     └──────────┘     └──────────────┘     └────┬─────┘
                                                            │
                                              Not registered?│
                                                            ▼
                                                   ┌──────────────┐
                                                   │  Register    │
                                                   │  (auto-gen   │
                                                   │   M00000000) │
                                                   └──────────────┘
```

### Feature Map

| Page | Route | Description |
|------|-------|-------------|
| **Home** | `/` | Welcome screen, points summary, quick action buttons, navigation grid |
| **Members Card** | `/card` | Digital membership card with QR code, member number, rank badge |
| **Point History** | `/points` | Paginated transaction history (earned/used points) |
| **Profile** | `/profile` | LINE profile info, member details, logout |
| **QR Scanner** | `/scan?mode=earn` | Scan store QR to earn points |
| **QR Scanner** | `/scan?mode=spend` | Scan store QR to spend points |

### Rank System

| Rank | Threshold |
|------|-----------|
| Bronze | 0 - 999 pt |
| Silver | 1,000 - 4,999 pt |
| Gold | 5,000 - 9,999 pt |
| Platinum | 10,000+ pt |

---

## Admin / Store Operator Features & Flow

### Admin Authentication

```
┌───────────────┐     ┌──────────────┐     ┌───────────────┐
│ /admin/login  │────→│ POST         │────→│ Bearer Token  │
│ username +    │     │ /api/admin/  │     │ stored in     │
│ password      │     │ login        │     │ localStorage  │
└───────────────┘     └──────────────┘     └───────┬───────┘
                                                   │
                                                   ▼
                                           ┌───────────────┐
                                           │ /admin        │
                                           │ (Dashboard)   │
                                           └───────────────┘
```

**Development bypass:** Use `Authorization: Bearer dev_admin_token` to skip login.

### Admin Feature Map

| Page | Route | Role | Description |
|------|-------|------|-------------|
| **Login** | `/admin/login` | - | Username/password authentication |
| **Dashboard** | `/admin` | All | Stats: total members, points issued/used, today's transactions, rank breakdown |
| **Members** | `/admin/members` | All | Searchable paginated member list, filter by rank |
| **Member Detail** | `/admin/members/:id` | All | Single member profile + point history |
| **Transactions** | `/admin/transactions` | All | All-member transaction log with type filter |
| **QR: Spend** | `/admin/qr/spend` | All | Generate QR for customer to spend points |
| **QR: Earn** | `/admin/qr/earn` | All | Generate QR with preset points for customer to earn |
| **Settings** | `/admin/settings` | Admin only | Operator account management (CRUD) |

### Role Permissions

| Action | Admin | Operator |
|--------|:-----:|:--------:|
| View dashboard, members, transactions | Yes | Yes |
| Create QR sessions (spend/earn) | Yes | Yes |
| Manage operators (create/edit/delete) | Yes | No |
| Manage settings | Yes | No |

---

## QR Point Flows

### Earn Flow (Store gives points to customer)

```
   STORE OPERATOR                              CUSTOMER (LINE App)
   ─────────────                              ──────────────────

1. Enter points amount
   (e.g. 100 pt)
        │
        ▼
2. [Generate QR]
   POST /api/admin/qr/earn
        │
        ▼
3. QR Code displayed        ──scan──→   4. Camera scans QR
   (polling for status)                     │
        │                                   ▼
        │                              5. GET /api/qr/validate/{token}
        │                                   │
        │                                   ▼
        │                              6. Confirm screen
        │                                 "Earn 100 pt?"
        │                                   │
        │                                   ▼
        │                              7. [Confirm] POST /api/qr/claim
        │                                   │
        ▼                                   ▼
8. Status: completed              9. Success! +100 pt
   "Customer Name"                   New balance shown
   "100 pt earned"
```

### Spend Flow (Customer pays with points)

```
   STORE OPERATOR                              CUSTOMER (LINE App)
   ─────────────                              ──────────────────

1. [Generate QR]
   POST /api/admin/qr/spend
   (no amount preset)
        │
        ▼
2. QR Code displayed        ──scan──→   3. Camera scans QR
   (polling for status)                     │
        │                                   ▼
        │                              4. GET /api/qr/validate/{token}
        │                                   │
        │                                   ▼
        │                              5. Enter points amount
        │                                 (e.g. 500 pt)
        │                                   │
        │                                   ▼
        │                              6. Confirm screen
        │                                 "Use 500 pt?"
        │                                   │
        │                                   ▼
        │                              7. [Confirm] POST /api/qr/claim
        │                                   │
        ▼                                   ▼
8. Status: completed              9. Success! -500 pt
   "Customer Name"                   New balance shown
   "500 pt spent"
```

### QR Data Format

```json
{
  "type": "spend" | "earn",
  "token": "<64-char random string>"
}
```

### Safety

- **One-time use:** `lockForUpdate()` in DB transaction prevents double-claiming
- **Expiry:** QR sessions expire after 10 minutes
- **Status check:** Only `pending` sessions can be claimed

---

## API Endpoints

### Member Endpoints (LINE Auth)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/member` | Get current member info |
| `POST` | `/api/member/register` | Register new member |
| `GET` | `/api/member/qrcode` | Get membership card QR (SVG) |
| `GET` | `/api/points/history` | Paginated point history |
| `POST` | `/api/points/add` | Add points |
| `POST` | `/api/points/use` | Use points |
| `GET` | `/api/qr/validate/{token}` | Validate QR session token |
| `POST` | `/api/qr/claim` | Claim QR session (earn/spend) |

### Admin Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/admin/login` | None | Login, returns token |
| `POST` | `/api/admin/logout` | Admin | Invalidate token |
| `GET` | `/api/admin/me` | Admin | Current admin user info |
| `GET` | `/api/admin/dashboard` | Admin | Dashboard statistics |
| `GET` | `/api/admin/members` | Admin | Paginated member list |
| `GET` | `/api/admin/members/{id}` | Admin | Member detail + history |
| `GET` | `/api/admin/transactions` | Admin | Paginated transactions |
| `POST` | `/api/admin/qr/spend` | Admin | Create spend QR session |
| `POST` | `/api/admin/qr/earn` | Admin | Create earn QR session |
| `GET` | `/api/admin/qr/sessions` | Admin | List QR sessions |
| `GET` | `/api/admin/qr/sessions/{id}` | Admin | Get session status (polling) |
| `GET` | `/api/admin/settings` | Admin (admin role) | Get settings |
| `PUT` | `/api/admin/settings` | Admin (admin role) | Update settings |
| `GET` | `/api/admin/operators` | Admin (admin role) | List operators |
| `POST` | `/api/admin/operators` | Admin (admin role) | Create operator |
| `PUT` | `/api/admin/operators/{id}` | Admin (admin role) | Update operator |
| `DELETE` | `/api/admin/operators/{id}` | Admin (admin role) | Delete operator |

---

## Project Structure

```
membership/
├── README.md
├── sys/
│   ├── backend/
│   │   ├── docker/                          # Docker config (nginx, PHP)
│   │   └── laravel-app/
│   │       ├── app/
│   │       │   ├── Http/
│   │       │   │   ├── Controllers/
│   │       │   │   │   ├── Admin/
│   │       │   │   │   │   ├── AdminAuthController.php
│   │       │   │   │   │   ├── AdminDashboardController.php
│   │       │   │   │   │   ├── AdminMemberController.php
│   │       │   │   │   │   ├── AdminTransactionController.php
│   │       │   │   │   │   ├── AdminQrController.php
│   │       │   │   │   │   └── AdminSettingsController.php
│   │       │   │   │   ├── MemberController.php
│   │       │   │   │   ├── PointController.php
│   │       │   │   │   └── QrClaimController.php
│   │       │   │   └── Middleware/
│   │       │   │       ├── LineAuthMiddleware.php
│   │       │   │       ├── AdminAuthMiddleware.php
│   │       │   │       └── AdminRoleMiddleware.php
│   │       │   ├── Models/
│   │       │   │   ├── Member.php
│   │       │   │   ├── PointHistory.php
│   │       │   │   ├── AdminUser.php
│   │       │   │   ├── AdminToken.php
│   │       │   │   └── QrSession.php
│   │       │   └── Services/
│   │       │       └── LineService.php
│   │       ├── database/
│   │       │   ├── migrations/
│   │       │   └── seeders/
│   │       └── routes/
│   │           └── api.php
│   └── frontend/
│       └── src/
│           ├── admin/                       # Admin SPA
│           │   ├── components/
│           │   │   ├── AdminGuard.tsx
│           │   │   ├── AdminHeader.tsx
│           │   │   └── AdminSidebar.tsx
│           │   ├── contexts/
│           │   │   └── AdminAuthContext.tsx
│           │   ├── hooks/
│           │   │   └── useAdminAuth.ts
│           │   ├── layouts/
│           │   │   └── AdminLayout.tsx
│           │   ├── pages/
│           │   │   ├── AdminLogin.tsx
│           │   │   ├── AdminDashboard.tsx
│           │   │   ├── AdminMembers.tsx
│           │   │   ├── AdminMemberDetail.tsx
│           │   │   ├── AdminTransactions.tsx
│           │   │   ├── AdminQrSpend.tsx
│           │   │   ├── AdminQrEarn.tsx
│           │   │   └── AdminSettings.tsx
│           │   ├── services/
│           │   │   └── adminApi.ts
│           │   ├── styles/
│           │   │   └── admin.css
│           │   └── types/
│           │       └── index.ts
│           ├── components/                  # Member components
│           │   ├── Header.tsx
│           │   └── Navigation.tsx
│           ├── hooks/
│           │   ├── useLiff.ts
│           │   └── useMember.ts
│           ├── pages/                       # Member pages
│           │   ├── Home.tsx
│           │   ├── MembersCard.tsx
│           │   ├── PointHistory.tsx
│           │   ├── Profile.tsx
│           │   └── QRScanner.tsx
│           ├── services/
│           │   ├── api.ts
│           │   └── liff.ts
│           ├── types/
│           │   └── index.ts
│           ├── App.tsx
│           ├── main.tsx
│           └── index.css
└── doc/
```

---

## Getting Started

### Prerequisites

- PHP 8.2+
- Composer
- Node.js 18+
- MySQL
- Docker (optional)

### Backend Setup

```bash
cd sys/backend/laravel-app

# Install dependencies
composer install

# Configure environment
cp .env.example .env
# Edit .env with your DB credentials and LINE channel info

# Run migrations and seed
php artisan migrate
php artisan db:seed    # Creates default admin: admin / admin123

# Start server
php artisan serve --port=3001
```

### Frontend Setup

```bash
cd sys/frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit VITE_LIFF_ID and VITE_API_BASE_URL

# Start dev server (HTTPS required for LIFF)
npm run dev
```

### Default Accounts

| Type | Username | Password | URL |
|------|----------|----------|-----|
| Admin | `admin` | `admin123` | `https://localhost:3000/admin/login` |

### Development Shortcuts

For API testing without LINE/admin authentication:

```bash
# Member endpoints (LINE auth bypass)
curl -H "Authorization: Bearer dev_test_token" \
     -H "X-Test-User-Id: test_user_001" \
     http://localhost:3001/api/member

# Admin endpoints (admin auth bypass)
curl -H "Authorization: Bearer dev_admin_token" \
     http://localhost:3001/api/admin/dashboard
```

> Dev bypass only works when `APP_DEBUG=true` in `.env`

---

## License

Private - All rights reserved.
