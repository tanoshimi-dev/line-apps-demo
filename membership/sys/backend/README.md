# LINE Membership Backend API

PHP Laravel backend for the LINE Membership management system.

## Tech Stack

- PHP 8.2
- Laravel 12
- MySQL 8
- Docker

## Quick Start

### Prerequisites

- Docker and Docker Compose installed

### Setup

1. **Start Docker containers:**
   ```bash
   cd sys/backend
   docker-compose up -d
   ```

2. **Install dependencies:**
   ```bash
   docker-compose exec app composer install
   ```

3. **Generate application key:**
   ```bash
   docker-compose exec app php artisan key:generate
   ```

4. **Run migrations:**
   ```bash
   docker-compose exec app php artisan migrate
   ```

5. **Configure LINE credentials:**
   Edit `laravel-app/.env` and set your LINE channel credentials:
   ```
   LINE_CHANNEL_ID=your_channel_id
   LINE_CHANNEL_SECRET=your_channel_secret
   ```

### API Endpoints

The API is available at `http://localhost:3001/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (no auth) |
| GET | `/api/member` | Get current member info |
| POST | `/api/member/register` | Register new member |
| GET | `/api/member/qrcode` | Get member QR code |
| GET | `/api/points/history` | Get point history (paginated) |
| POST | `/api/points/add` | Add points |
| POST | `/api/points/use` | Use/deduct points |

### Authentication

All endpoints (except `/api/health`) require a LINE access token in the Authorization header:

```
Authorization: Bearer <LINE_ACCESS_TOKEN>
```

### Example Requests

**Get Member Info:**
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/member
```

**Register New Member:**
```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" http://localhost:3001/api/member/register
```

**Add Points:**
```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"points": 100, "reason": "Purchase reward"}' \
  http://localhost:3001/api/points/add
```

**Use Points:**
```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"points": 50, "reason": "Discount redemption"}' \
  http://localhost:3001/api/points/use
```

### Stopping the Services

```bash
docker-compose down
```

To also remove the database volume:
```bash
docker-compose down -v
```

## Development

### Useful Commands

```bash
# View logs
docker-compose logs -f

# Run artisan commands
docker-compose exec app php artisan <command>

# Access MySQL
docker-compose exec db mysql -u membership_user -pmembership_password membership

# Run tests
docker-compose exec app php artisan test
```

## Database Schema

### Members Table
- `id` (UUID, primary key)
- `line_user_id` (string, unique)
- `display_name` (string)
- `member_number` (string, unique)
- `points` (integer, default 0)
- `rank` (enum: bronze, silver, gold, platinum)
- `picture_url` (string, nullable)
- `created_at`, `updated_at`

### Point Histories Table
- `id` (UUID, primary key)
- `member_id` (foreign key)
- `type` (enum: add, use)
- `points` (integer)
- `balance` (integer)
- `reason` (string)
- `created_at`

## Rank System

| Rank | Points Required |
|------|-----------------|
| Bronze | 0+ |
| Silver | 1,000+ |
| Gold | 5,000+ |
| Platinum | 10,000+ |
