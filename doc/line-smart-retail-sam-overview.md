# LINE Smart Retail SAM Application Overview

## 1. Project Purpose

**Smart Retail** is a self-checkout mobile application that enables customers to scan products and pay using their smartphones via LINE. It reduces store/clerk workload by having customers perform checkout themselves through the LINE ecosystem.

**Key Capabilities:**
- Scan product barcodes using device camera
- Build a shopping cart with item quantities and discounts
- Apply coupons to products or entire purchases
- Complete payment via LINE Pay (or free checkout for 0-yen orders)
- Receive digital receipts via LINE messaging
- View purchase history in the LIFF app

---

## 2. Project Structure

```
line-api-use-case-smart-retail/
├── backend/
│   ├── APP/                          # Main Lambda functions
│   │   ├── get_item_info/            # Product lookup by barcode
│   │   ├── get_coupons_info/         # List available coupons
│   │   ├── get_order_info/           # Purchase history
│   │   ├── put_cart_data/            # Create/update orders
│   │   ├── put_linepay_request/      # Initiate LINE Pay
│   │   ├── put_linepay_confirm/      # Confirm payment
│   │   ├── dynamodb_data/            # Sample product data
│   │   └── template.yaml             # Main SAM template
│   ├── batch/                        # Batch processing
│   │   ├── update_line_access_token/ # Token refresh job
│   │   └── template.yaml             # Batch SAM template
│   └── Layer/                        # Shared Lambda layer
│       ├── layer/
│       │   ├── aws/                  # DynamoDB operations
│       │   ├── common/               # LINE API, utilities
│       │   ├── smart_retail/         # Business logic
│       │   └── validation/           # Parameter validation
│       └── template.yaml             # Layer SAM template
├── front/                            # Nuxt.js SPA application
│   ├── pages/                        # Page components
│   │   └── smaphregi/                # Main app pages
│   ├── components/                   # Vue components
│   ├── plugins/                      # Nuxt plugins
│   ├── layouts/                      # Layout templates
│   ├── locales/                      # i18n translations
│   ├── store/                        # Vuex state management
│   └── assets/                       # Static assets
└── docs/                             # Documentation (JP & EN)
```

---

## 3. SAM Template Configuration

### Main Backend Template (`backend/APP/template.yaml`)

**Lambda Functions (6 total):**
- `GetItemInfo` - Returns product details by barcode
- `GetCouponsInfo` - Lists available coupons
- `GetOrderInfo` - Retrieves purchase history for a user
- `PutCartData` - Creates/updates shopping cart orders
- `LinepayReserve` - Initiates LINE Pay payment request
- `LinepayConfirm` - Confirms payment and records transaction

**DynamoDB Tables (3 total):**
- `RegisterItemInfoDB` - Product catalog (barcode → item details)
- `RegisterOrderInfoDB` - Orders with user GSI (userId-orderId-index)
- `RegisterCouponInfoDB` - Coupon definitions

**CDN/Frontend Hosting:**
- S3 bucket for static assets
- CloudFront distribution for CDN delivery
- Origin Access Identity for secure S3 access

### Batch Template (`backend/batch/template.yaml`)

- EventBridge cron job: Daily at midnight (UTC)
- Refreshes LINE Messaging API short-term access tokens
- Stores tokens in DynamoDB with 20-day expiry

### Layer Template (`backend/Layer/template.yaml`)

- Shared Python dependencies
- Python 3.8 runtime

---

## 4. Lambda Functions in Detail

### GetItemInfo

- Validates barcode parameter
- Returns product name, price, image URL
- Includes coupon info if applicable
- Used by barcode scanner feature

### PutCartData

- Creates new order or updates existing cart
- Validates LIFF ID token to extract user ID
- Calculates total with item-level and cart-level discounts
- Supports two discount methods: percentage (method=1) or fixed amount (method=2)
- Sends receipt message via LINE Messaging API for 0-yen orders
- Stores data with TTL for automatic expiration

### LinepayReserve

- Initiates LINE Pay payment flow
- Calls LINE Pay API with order details
- Returns payment URL for customer redirection
- Packages product info with amount and currency (JPY)

### LinepayConfirm

- Confirms payment after customer returns from LINE Pay
- Updates DynamoDB with transaction ID
- Sends receipt message with purchase history link
- Uses channelAccessToken stored in DB

### GetOrderInfo

- Queries orders by userId (GSI query)
- Can filter by specific orderId
- Returns full order history with items and amounts

### GetCouponsInfo

- Returns list of active coupons
- Includes discount rates, descriptions, validity dates
- Used for coupon carousel display

---

## 5. API Endpoints

| Endpoint | Method | Purpose | Key Parameters |
|----------|--------|---------|----------------|
| `/get_item_info` | GET | Fetch product info | barcode, couponId |
| `/get_coupons_info` | GET | List active coupons | (none) |
| `/put_cart_data` | POST | Create/update order | idToken, items[], couponId, orderId |
| `/put_linepay_request` | POST | Start payment | idToken, orderId |
| `/put_linepay_confirm` | POST | Complete payment | orderId, transactionId |
| `/get_order_info` | GET | Get purchase history | idToken, orderId (optional) |

### API Gateway Configuration

- RESTful API with 6 endpoints
- CORS enabled for cross-origin requests
- Supports GET, POST, OPTIONS methods

---

## 6. Database Schemas

### RegisterItemInfoDB (Product Catalog)

```
Primary Key: barcode (String)
Attributes:
  - barcode: String (e.g., "1230059783947")
  - itemName: String (e.g., "書籍")
  - itemPrice: Number (e.g., 100)
  - imageUrl: String
  - couponId: String (optional, references coupon)
  - discountRate: Number (optional)
  - discountWay: Number (optional, 1=%, 2=¥)
```

### RegisterOrderInfoDB (Orders)

```
Primary Key: orderId (String - UUID)
Global Secondary Index: userId-orderId-index
Attributes:
  - orderId: String (UUID)
  - userId: String (LINE user ID)
  - amount: Number (total amount)
  - item[]: Array of items
    - barcode: String
    - itemName: String
    - itemPrice: Number
    - quantity: Number
    - couponId: String (optional)
  - discountWay: Number (1=percentage, 2=fixed)
  - discountRate: Number
  - transactionId: String (LINE Pay transaction ID)
  - paidDateTime: String
  - orderDateTime: String
  - expirationDate: Number (Unix timestamp for TTL)
```

### RegisterCouponInfoDB (Coupons)

```
Primary Key: couponId (String)
Attributes:
  - couponId: String (e.g., "watermelon_coupon")
  - barcode: String (product barcode or "*" for all)
  - itemName: String
  - imageUrl: String
  - discountWay: Number (1=%, 2=¥)
  - discountRate: Number
  - couponDescription: String
  - remarks: String
  - discountStartDatetime: String
  - discountEndDatetime: String
```

---

## 7. Dependencies and Technologies

### Backend Stack

- **Runtime**: Python 3.8
- **AWS SDK**: boto3 for DynamoDB
- **LINE SDKs**: linebot (Messaging API), linepay (LINE Pay)
- **HTTP**: requests library
- **Date/Time**: python-dateutil for timezone handling

### Frontend Stack

- **Framework**: Nuxt.js 2.15.3 (Vue.js)
- **i18n**: Vue i18n 8.24.0 (Internationalization)
- **Auth**: AWS Amplify 3.3.23
- **Barcode**: Quagga2 1.3.1 or Scandit 5.5.3
- **UI**: Vuetify 1.11.3 (Material Design)
- **Icons**: Material Design Icons

### AWS Services

| Service | Purpose |
|---------|---------|
| **Lambda** | Serverless compute |
| **DynamoDB** | NoSQL database |
| **API Gateway** | REST API |
| **CloudFront** | CDN for frontend |
| **S3** | Static asset hosting |
| **EventBridge** | Scheduled batch jobs |
| **IAM** | Access control |

---

## 8. Smart Retail Flow

### Complete User Journey

```
1. SCANNING PHASE
   └─> Customer opens LIFF app → /smaphregi page
   └─> Camera activates for barcode scanning (Quagga2 or Scandit)
   └─> For each scanned barcode:
       ├─> GET /get_item_info → retrieve product details
       └─> Add to local cart (Vue store)

2. CART MANAGEMENT
   └─> Display cart with running total
   └─> Apply item-level discounts (from product data)
   └─> Apply cart-level coupon (optional)
   └─> Calculate final amount

3. ORDER CREATION
   └─> Customer initiates payment
   └─> POST /put_cart_data
       ├─> Validate ID token (extract userId)
       ├─> Create order in DynamoDB
       └─> Return orderId

4. PAYMENT (if amount > 0)
   └─> POST /put_linepay_request
       ├─> Call LINE Pay Reserve API
       └─> Return payment URL
   └─> Redirect to LINE Pay
   └─> Customer approves payment

5. CONFIRMATION
   └─> LINE Pay redirects to /completed page
   └─> POST /put_linepay_confirm
       ├─> Confirm with LINE Pay API
       ├─> Update order with transactionId & paidDateTime
       └─> Send receipt via LINE Messaging API

6. FREE ORDERS (amount = 0)
   └─> Skip LINE Pay flow
   └─> POST /put_cart_data handles completion
   └─> Send receipt immediately

7. HISTORY
   └─> GET /get_order_info → retrieve past purchases
   └─> Display in /smaphregi/history page
```

---

## 9. LINE API Integrations

### LIFF (LINE Front-end Framework)

- Enables secure access from LINE app
- Provides ID token for user authentication
- Version 2.8.0 loaded from CDN
- Extracts userId from idToken

### LINE Messaging API

- Sends push messages with receipt (Flex Message)
- Uses short-term channel access token (refreshed daily)
- Flex message template with purchase details
- Includes link to order details page

### LINE Pay API

| Operation | Purpose |
|-----------|---------|
| **Reserve** | Initiate payment authorization |
| **Confirm** | Finalize transaction after approval |

**Request Parameters:**
- Amount and currency (JPY)
- Package and product information
- Redirect URLs (confirmUrl, cancelUrl)
- Display locale (Japanese)
- Capture flag (immediate capture enabled)

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LINE MOBILE APP                          │
│                    (Customer's Phone)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ (LIFF App)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        CloudFront + S3 (Frontend Hosting)                   │
│     Nuxt.js/Vue.js Single-Page Application                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Barcode Scanner (Quagga2 / Scandit)                │   │
│  │  - Camera access                                     │   │
│  │  - Real-time barcode detection                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Shopping Cart (Vuex State)                          │   │
│  │  - Item management                                   │   │
│  │  - Discount calculation                              │   │
│  │  - Coupon application                                │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ (HTTPS)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            API GATEWAY (REST API)                           │
│  - GET  /get_item_info                                      │
│  - GET  /get_coupons_info                                   │
│  - GET  /get_order_info                                     │
│  - POST /put_cart_data                                      │
│  - POST /put_linepay_request                                │
│  - POST /put_linepay_confirm                                │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
┌──────────────┐┌───────────┐┌───────────┐┌───────────────┐
│  Lambda      ││  Lambda   ││  Lambda   ││  Lambda       │
│  (Product)   ││  (Order)  ││  (Coupon) ││  (Payment)    │
│              ││           ││           ││               │
│ -GetItemInfo ││-PutCart   ││-GetCoupons││-LinepayReserve│
│              ││-GetOrder  ││           ││-LinepayConfirm│
└──────────────┘└───────────┘└───────────┘└───────────────┘
        │             │             │             │
        └─────────────┴─────────────┴─────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  DynamoDB                           │
        │                                     │
        │ [RegisterItemInfoDB]                │
        │  - Product catalog (barcode key)    │
        │                                     │
        │ [RegisterOrderInfoDB]               │
        │  - Orders (userId-orderId GSI)      │
        │  - TTL-based auto-deletion          │
        │                                     │
        │ [RegisterCouponInfoDB]              │
        │  - Coupon definitions               │
        └─────────────────────────────────────┘

         ┌──────────────────────────────────┐
         │   External LINE Services         │
         │                                  │
         │ ┌─────────────────────────────┐  │
         │ │  LINE Messaging API         │  │
         │ │ - Receipt push messages     │  │
         │ │ - Flex message format       │  │
         │ └─────────────────────────────┘  │
         │                                  │
         │ ┌─────────────────────────────┐  │
         │ │  LINE Pay API               │  │
         │ │ - Reserve payment           │  │
         │ │ - Confirm transaction       │  │
         │ └─────────────────────────────┘  │
         │                                  │
         │ ┌─────────────────────────────┐  │
         │ │  LIFF Auth                  │  │
         │ │ - ID token verification     │  │
         │ └─────────────────────────────┘  │
         └──────────────────────────────────┘

Batch Process (Daily):
┌─────────────────────────────────┐
│ EventBridge (Cron: 0 0 * * ? *) │
│     (Midnight UTC)              │
└─────────────┬───────────────────┘
              │
              ▼
      ┌───────────────┐       ┌───────────────────┐
      │ Lambda        │──────>│ DynamoDB          │
      │ UpdateAccess  │       │ [ChannelAccessTokenDB] │
      │ Token         │       │ - Refresh tokens  │
      └───────────────┘       └───────────────────┘
```

---

## 11. Unique Features

### Barcode Scanning

- **Quagga2**: Open-source JavaScript barcode scanner
- **Scandit**: Enterprise-grade scanning (optional)
- Real-time camera feed processing
- Supports multiple barcode formats

### Flexible Discount System

| Discount Level | Method 1 (%) | Method 2 (¥) |
|----------------|--------------|--------------|
| **Item-level** | 10% off item | ¥20 off item |
| **Cart-level** | 5% off total | ¥100 off total |

- Discounts applied server-side (not trusting frontend)
- Both methods can coexist

### Zero-Amount Transaction Support

- Handles free/gifted items seamlessly
- Skips LINE Pay flow when amount = 0
- Still records order and sends receipt

### Coupon System

- Coupons can target specific products (by barcode) or all products ("*")
- Time-based validity (start/end datetime)
- Displayed in carousel on main page

### Purchase History

- Global Secondary Index for efficient user queries
- Full order details with items and amounts
- Accessible via LIFF app

---

## 12. Frontend Architecture

### Pages

| Page | Purpose |
|------|---------|
| `/smaphregi/index` | Main scanner interface with carousel |
| `/smaphregi/coupon` | Coupon display |
| `/smaphregi/history/:orderId` | Purchase history |
| `/smaphregi/completed/:transactionId/:orderId` | Payment success page |

### Key Components

- `Carousel.vue` - Promotion carousel (coupons, products, job listings)
- `Coupon.vue` - Coupon panel
- `Product.vue` - Product panel
- `Parttime.vue` - Job listing panel

### State Management

- **Vuex store**: Locale, user profile, shopping data
- **LocalStorage**: Cart persistence
- **SessionStorage**: Temporary data

### Plugins

| Plugin | Purpose |
|--------|---------|
| `smaphregi.js` | API wrapper with discount utilities |
| `liff.js` | LIFF SDK initialization |
| `barcodeScanner.js` | Quagga/Scandit abstraction |
| `amplify.js` | AWS Amplify authentication |

---

## 13. Comparison with Other LINE API Projects

| Feature | Members Card | Restaurant Reservation | Table Order | Smart Retail |
|---------|--------------|------------------------|-------------|--------------|
| **Purpose** | Loyalty points | Booking system | In-restaurant ordering | Self-checkout |
| **Frontend** | Plain HTML/JS | Nuxt.js | Nuxt.js | Nuxt.js |
| **Payment** | No | No | LINE Pay | LINE Pay |
| **Barcode Scanning** | No | No | No | **Yes** |
| **API Endpoints** | 1 | 5 | 8 | 6 |
| **DynamoDB Tables** | 3 | 5 | 3 | 3 |
| **Coupon System** | No | No | No | **Yes** |
| **Item Discounts** | No | No | Yes | **Yes (2 methods)** |
| **Cart Discounts** | No | No | No | **Yes** |
| **Zero-Amount Orders** | N/A | N/A | No | **Yes** |
| **Purchase History** | No | No | No | **Yes** |

### Smart Retail Unique Strengths

1. **Self-checkout automation** - Customers handle own scanning/payment
2. **Barcode integration** - Quagga2 or Scandit for product identification
3. **Real-time inventory lookup** - DynamoDB for instant product data
4. **Flexible discounting** - Item-level AND cart-level with two methods
5. **Zero-amount support** - Handles free/gifted items
6. **Coupon management** - Time-based, product-specific or universal
7. **Purchase history** - GSI for quick user lookup

---

## 14. Deployment and Configuration

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `LIFF_CHANNEL_ID` | LIFF app channel ID |
| `OA_CHANNEL_ID` | LINE Official Account channel ID |
| `LINEPAY_CHANNEL_ID` | LINE Pay merchant channel ID |
| `LINEPAY_CHANNEL_SECRET` | LINE Pay secret key |
| `ITEM_INFO_DB` | Product catalog table name |
| `ORDER_INFO_DB` | Orders table name |
| `COUPON_INFO_DB` | Coupons table name |
| `CHANNEL_ACCESS_TOKEN_DB` | Token storage table name |
| `TTL` | Enable/disable auto-deletion |
| `TTLDay` | Days to retain data before deletion |
| `LOGGER_LEVEL` | DEBUG or INFO |

### Deployment Steps

1. Deploy Layer stack (shared dependencies)
2. Deploy Batch stack (token management)
3. Deploy APP stack (main application)
4. Build Nuxt.js frontend
5. Deploy frontend to S3
6. Configure LIFF app with CloudFront URL

---

## 15. Summary

The LINE Smart Retail application is a sophisticated self-checkout solution that combines:

- **Barcode scanning** for instant product identification
- **LINE Pay integration** for seamless mobile payments
- **Flexible coupon and discount system** for promotions
- **Purchase history tracking** for customer convenience
- **Receipt messaging** via LINE for engagement

This represents the most feature-rich of the four LINE API use cases, providing a complete retail checkout experience entirely within the LINE ecosystem.
