# LINE Table Order SAM Application Overview

## 1. Project Purpose

This is a **table-based ordering system for restaurants** built with AWS SAM and LINE APIs. It eliminates the need for physical ordering terminals by allowing customers to order directly from their phones via LINE.

**Key Capabilities:**
- Customers view restaurant menus within the LINE app via LIFF
- Browse product categories and items with images, prices, and descriptions
- Add items to a shopping basket with quantity selection
- Apply discounts (fixed price or percentage-based)
- Process payments via LINE Pay or alternative payment methods
- Receive promotional messages via LINE Messaging API after payment
- Track order status by payment ID

---

## 2. Project Structure

```
line-api-use-case-table-order/
├── backend/
│   ├── APP/                    # Main application Lambda functions
│   │   ├── category_get/       # Get menu categories
│   │   ├── item_list_get/      # Get items in a category
│   │   ├── order_put/          # Create/update orders
│   │   ├── order_info_get/     # Retrieve order details
│   │   ├── payment_reserve/    # LINE Pay reserve endpoint
│   │   ├── payment_confirm/    # LINE Pay confirm endpoint
│   │   ├── payment_confirm_nolinepay/  # Non-LINE Pay confirmation
│   │   ├── payment_id_get/     # Get payment ID
│   │   ├── dynamodb_data/      # Sample menu data
│   │   └── template.yaml       # Main SAM template
│   ├── batch/                  # Batch processes
│   │   ├── update_line_access_token/  # Token refresh job
│   │   └── template.yaml       # Batch SAM template
│   └── Layer/                  # Shared Lambda layer
│       ├── layer/              # Reusable code/libraries
│       │   ├── aws/            # AWS DynamoDB operations
│       │   ├── common/         # LINE API, utilities, constants
│       │   ├── table_order/    # Business logic models
│       │   └── validation/     # Parameter validation
│       └── template.yaml       # Layer SAM template
├── front/                      # Vue.js/Nuxt.js frontend (LIFF app)
│   ├── pages/                  # Application pages
│   ├── components/             # Vue components
│   ├── store/                  # Vuex state management
│   ├── nuxt.config.js          # Nuxt configuration
│   └── package.json            # Node.js dependencies
└── docs/                       # Documentation
```

---

## 3. SAM Template Configuration

### Main Backend Template (`backend/APP/template.yaml`)

- **CloudFormation Transform**: AWS::Serverless-2016-10-31
- **Environment Support**: Dev and Prod configurations with separate databases
- **Lambda Memory**: Configurable (128-3008 MB)
- **Timeout**: 30 seconds (global), with 3-second overrides for quick API calls

**Key Configuration Parameters**:

| Parameter | Purpose |
|-----------|---------|
| `LineChannelId` | LINE Messaging API channel ID |
| `LIFFChannelId` | LIFF app channel ID |
| `LinePayChannelId` | LINE Pay merchant credentials |
| `ItemListDBName` | Menu items database |
| `PaymentInfoDBName` | Payment/order database |
| `TTL` | Time-To-Live for auto-deleting old payment records |
| `LoggerLevel` | DEBUG or INFO |

### Batch Template (`backend/batch/template.yaml`)

- EventBridge cron job: Runs daily at midnight (UTC) to refresh access tokens
- Creates LINE Channel Access Token DynamoDB table

### Layer Template (`backend/Layer/template.yaml`)

- Creates a Lambda Layer with shared Python dependencies
- Compatible with Python 3.8 runtime

---

## 4. Lambda Functions and Their Purposes

| Function | Endpoint | HTTP Method | Purpose |
|----------|----------|-------------|---------|
| **CategoryGet** | `/category_get` | GET | Returns all menu categories with their IDs and names |
| **ItemListGet** | `/item_list_get` | GET | Returns items in a specific category with prices, images, descriptions |
| **OrderPut** | `/order_put` | POST | Creates new order or updates existing order with items; validates via LIFF ID token |
| **OrderInfoGet** | `/order_info_get` | GET | Retrieves order details by payment ID; checks if already paid |
| **PaymentReserve** | `/payment_reserve` | POST | Initiates LINE Pay transaction; redirects customer to LINE Pay screen |
| **PaymentConfirm** | `/payment_confirm` | POST | Confirms LINE Pay payment; updates transaction ID; sends push notification |
| **ConfirmNoLinepay** | `/confirm_nolinepay` | POST | Alternative confirmation for non-LINE Pay payments (e.g., cash, store credit) |
| **PaymentIdGet** | `/payment_id_get` | GET | Retrieves payment ID for a specific user/transaction |
| **UpdateAccessToken** (Batch) | EventBridge | Scheduled | Refreshes LINE Channel Access Token daily |

---

## 5. API Endpoints

### API Gateway Configuration

- Base URL: `https://{api-gateway-id}.execute-api.{region}.amazonaws.com/{environment}/`
- CORS: Enabled for all origins
- Allowed Methods: GET, POST, OPTIONS
- Allowed Headers: Origin, Authorization, Accept, X-Requested-With, Content-Type

### Key Endpoint Flow

```
User selects items → /item_list_get → /order_put (creates payment)
→ /payment_reserve (LINE Pay) → /payment_confirm (confirms payment)
→ Promotional message sent via LINE Bot
```

---

## 6. Database Schemas

### TableOrderItemList (Menu Items)

```
Primary Key: categoryId (Number)
Attributes:
  - categoryId: Number
  - categoryName: String
  - item[]: Array of items
    - itemId: Number
    - itemName: String
    - price: Number
    - discountRate: Number (discount amount or percentage)
    - discountWay: Number (1=fixed, 2=percentage)
    - imageUrl: String
    - description: String
```

### PaymentOrderInfo (Orders & Transactions)

```
Primary Key: paymentId (String - UUID)
Global Secondary Index: userId-index
Attributes:
  - paymentId: String (UUID)
  - userId: String (LINE user ID)
  - transactionId: Number (0=unpaid, LINE Pay ID when paid, 99999999999=non-LINE-Pay)
  - amount: Number (total order amount)
  - order[]: Array of order objects
    - orderId: Number
    - tableId: String
    - item[]: Array of ordered items
    - createdTime: String
    - updatedTime: String
  - paidDatetime: String
  - expirationDate: Number (TTL attribute)
  - createdTime: String
  - updatedTime: String
```

### LINEChannelAccessTokenDB (Token Storage)

```
Primary Key: channelId (String)
Attributes:
  - channelId: String
  - channelAccessToken: String (short-lived token)
  - channelSecret: String
  - limitDate: String (expiration date)
  - updatedTime: String
```

---

## 7. Dependencies and Technologies

### Backend Stack

- **Runtime**: Python 3.8
- **AWS Services**: Lambda, DynamoDB, API Gateway, CloudFront, S3, EventBridge, IAM
- **Python Libraries**:
  - `boto3`: AWS SDK
  - `linebot`: LINE Messaging API SDK
  - `linepay`: LINE Pay API (custom module)
  - `dateutil`: Timezone handling
  - `requests`: HTTP client

### Frontend Stack

- **Framework**: Nuxt.js 2.13.3 (Vue.js-based SSG/SPA)
- **State Management**: Vuex (with persisted state)
- **HTTP Client**: Axios
- **UI Framework**: Vuetify (Material Design)
- **Auth**: AWS Amplify
- **LIFF Integration**: LINE Front-end Framework 2.5.0
- **i18n**: Vue-i18n (for multi-language support)

### Infrastructure

- **Frontend CDN**: CloudFront + S3 bucket
- **SSL/TLS**: HTTPS enforced
- **CORS**: Handled at API Gateway level

---

## 8. Table Ordering Flow

### Complete Flow Diagram

```
1. USER BROWSING PHASE
   └─> LIFF app loads at CloudFront URL
   └─> Gets LIFF ID token via liff.getIDToken()
   └─> Frontend calls /category_get → displays menu categories

2. ITEM SELECTION PHASE
   └─> User selects category → calls /item_list_get with categoryId
   └─> Frontend displays items with images, prices, descriptions
   └─> User adds items to basket (stored in Vuex state)
   └─> Can add multiple items from different categories

3. ORDER CREATION PHASE
   └─> User submits basket → /order_put (POST)
       ├─> Backend validates ID token (via LIFF channel)
       ├─> Extracts userId from token claims
       ├─> Validates items against master data
       ├─> Calculates total with discounts applied
       ├─> Creates PaymentOrderInfo record (transactionId = 0)
       ├─> Returns paymentId (UUID)
       └─> Frontend stores paymentId in Vuex state

4. PAYMENT PHASE (LINE Pay)
   └─> User clicks "Pay with LINE Pay" → /payment_reserve (POST)
       ├─> Extracts payment info from database
       ├─> Calls LINE Pay API with:
       │   ├─> Amount (JPY)
       │   ├─> orderId (paymentId)
       │   ├─> Package details (items)
       │   ├─> Confirm/Cancel redirect URLs
       │   └─> Capture: true
       └─> Returns paymentUrl and transactionId

   └─> Frontend redirects to paymentUrl
   └─> User completes payment on LINE Pay screen

5. PAYMENT CONFIRMATION PHASE
   └─> LINE Pay redirects to /payment_confirm
       ├─> Backend confirms transaction with LINE Pay API
       ├─> Updates PaymentOrderInfo:
       │   ├─> transactionId = LINE Pay transaction ID
       │   ├─> paidDatetime = current time
       │   ├─> expirationDate = current time + TTL days
       │   └─> updatedTime = current time
       ├─> Retrieves short-lived channel access token
       ├─> Sends promotional Flex Message to user via LINE Bot
       └─> Returns success response

6. ALTERNATIVE FLOW (No LINE Pay)
   └─> /confirm_nolinepay (POST)
       ├─> Skips LINE Pay confirmation
       ├─> Sets transactionId = 99999999999 (marker for non-LINE-Pay)
       └─> Used for cash/credit card/store credit payments

7. COMPLETION
   └─> User sees payment confirmation page
   └─> Backend sends push notification with order details/coupon
   └─> Order marked as paid (transactionId != 0)
```

---

## 9. LINE API Integrations

### LIFF (LINE Front-end Framework)

- User authentication via ID tokens
- `liff.getIDToken()` in frontend
- Backend validates with `/oauth2/v2.1/verify` endpoint
- Extracts `sub` claim as userId
- 30-second token expiry check

### LINE Messaging API

- **Push Messages**: Sends promotional Flex Messages after payment
- **Channel Access Token**: Short-lived tokens (valid ~20 days)
- Stored in DynamoDB with expiration dates
- Daily batch job refreshes expired tokens
- Flex Message Content: Coupon/promotional offer (FLEX_COUPON template)

### LINE Pay API

- **Reserve Endpoint**: Initiates payment
- **Confirm Endpoint**: Finalizes payment
- Supports sandbox mode (configurable)
- Transaction ID returned by LINE Pay used for reconciliation
- Automatic capture enabled

### API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `https://api.line.me/oauth2/v2.1/verify` | Extract userId from ID token |
| `https://api.line.me/v2/oauth2/accessToken` | Batch token refresh |
| LINE Pay Reserve API | Initiate payment |
| LINE Pay Confirm API | Confirm payment |

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    LINE MOBILE APP                          │
│                    (User's Phone)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ (LIFF App)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│        CloudFront + S3 (Frontend Hosting)                   │
│     Nuxt.js/Vue.js Single-Page Application                  │
│  - Menu browsing (categories/items)                         │
│  - Shopping basket (Vuex state)                             │
│  - Payment flow (LINE Pay redirect)                         │
│  - Order confirmation                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ (HTTPS)
                      ▼
┌─────────────────────────────────────────────────────────────┐
│            API GATEWAY (REST API)                           │
│  - /category_get           (GET)                            │
│  - /item_list_get          (GET)                            │
│  - /order_put              (POST)                           │
│  - /order_info_get         (GET)                            │
│  - /payment_reserve        (POST)                           │
│  - /payment_confirm        (POST)                           │
│  - /confirm_nolinepay      (POST)                           │
│  - /payment_id_get         (GET)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌──────────────┐ ┌───────────┐ ┌───────────────┐
│  Lambda      │ │  Lambda   │ │  Lambda       │
│  (Read Ops)  │ │  (Order   │ │  (Payment)    │
│              │ │   Logic)  │ │               │
│ -CategoryGet │ │           │ │ -Reserve      │
│ -ItemListGet │ │ -OrderPut │ │ -Confirm      │
│ -OrderInfoGet│ │           │ │ -ConfirmNoPay │
│ -PaymentIdGet│ │           │ │               │
└──────────────┘ └───────────┘ └───────────────┘
        │             │             │
        └─────────────┼─────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  DynamoDB (Main Stack)              │
        │                                     │
        │ [TableOrderItemList]                │
        │  - Categories & Menu Items          │
        │                                     │
        │ [PaymentOrderInfo]                  │
        │  - Orders & Transactions            │
        │  - userId-index (GSI)               │
        │  - TTL-based auto-deletion          │
        └─────────────────────────────────────┘

         ┌──────────────────────────────────┐
         │   External LINE Services         │
         │                                  │
         │ ┌─────────────────────────────┐  │
         │ │  LINE Messaging API         │  │
         │ │ - Push notifications        │  │
         │ │ - Flex messages (coupons)   │  │
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

### Compared to Typical E-Commerce Systems

| Feature | Description |
|---------|-------------|
| **LIFF-Native Experience** | No separate app installation - runs in LINE chat with seamless user authentication |
| **Hybrid Payment Support** | LINE Pay (primary) + Cash/Card (manual confirmation) |
| **Multi-Category Basket** | Orders can contain items from multiple categories, auto-sorted for efficient DB queries |
| **Flexible Discount System** | Per-item discounts: fixed price reduction OR percentage reduction, calculated server-side |
| **Promotional Messaging** | Automatic push notification after payment for customer engagement |
| **Short-Lived Token Management** | Batch job maintains fresh LINE access tokens (~20-day validity) |
| **Order State Management** | Orders can be added to same payment ID before payment; locked after payment |
| **Data Retention Control** | Optional TTL on payment records for GDPR/privacy compliance |
| **Multi-Language Support** | Frontend uses Vue-i18n for internationalization |

### Order State Transitions

```
transactionId = 0          → Unpaid (can add more items)
transactionId = LINE Pay ID → Paid via LINE Pay (locked)
transactionId = 99999999999 → Paid via other method (locked)
```

---

## 12. Comparison with Other LINE API Projects

| Feature | Members Card | Restaurant Reservation | Table Order |
|---------|--------------|------------------------|-------------|
| **Purpose** | Loyalty points | Booking system | In-restaurant ordering |
| **Frontend** | Plain HTML/JS | Nuxt.js | Nuxt.js |
| **Payment** | No | No | LINE Pay + alternatives |
| **API Endpoints** | 1 | 5 | 8 |
| **DynamoDB Tables** | 3 | 5 | 3 |
| **Batch Jobs** | 1 | 2 | 1 |
| **Key Feature** | Points & receipts | Reminders | Real-time ordering & payment |
| **Discount System** | No | No | Yes (fixed/percentage) |

---

## 13. Deployment and Configuration

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `LIFF_CHANNEL_ID` | LIFF app channel ID for token validation |
| `OA_CHANNEL_ID` | LINE Official Account channel ID |
| `LINEPAY_CHANNEL_ID` | LINE Pay merchant channel ID |
| `LINEPAY_CHANNEL_SECRET` | LINE Pay secret key |
| `ITEM_LIST_DB` | Menu items table name |
| `PAYMENT_INFO_DB` | Payment/order table name |
| `CHANNEL_ACCESS_TOKEN_DB` | Token storage table name |
| `TTL` | Enable/disable auto-deletion |
| `TTLDay` | Days to retain data before deletion |
| `LOGGER_LEVEL` | DEBUG or INFO |

### Deployment Steps

1. Deploy Layer stack first (shared dependencies)
2. Deploy Batch stack (token management)
3. Deploy APP stack (main application)
4. Build and deploy frontend to S3
5. Configure LIFF app with CloudFront URL

---

## 14. Summary

This LINE Table Order application demonstrates a production-ready in-restaurant ordering system that:

- Runs entirely within LINE app (no separate installation)
- Handles complete order lifecycle from browsing to payment
- Integrates LINE Pay for seamless mobile payments
- Sends promotional messages to drive customer engagement
- Supports flexible discount configurations
- Maintains data privacy with TTL-based cleanup

The architecture is scalable, maintainable, and fully leverages AWS managed services combined with LINE's ecosystem.
