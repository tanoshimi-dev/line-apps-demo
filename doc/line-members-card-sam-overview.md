# LINE Members Card SAM Application Overview

## 1. Project Purpose

This is a **LINE Official Account (OA) Membership Card Demo Application** built on AWS using Serverless Application Model (SAM). The application demonstrates how to:

- Create and manage digital membership cards in LINE
- Award loyalty points on purchases
- Generate electronic receipts as LINE Flex Messages
- Display barcode-based membership cards in the LINE LIFF (LINE Front-end Framework)

The application provides a practical template for retailers, supermarkets, drug stores, and apparel companies to transition from physical to digital membership cards.

---

## 2. Project Structure

```
line-api-use-case-MembersCard/
├── backend/
│   ├── APP/                      # Main Lambda application
│   │   ├── members_card/         # Core Lambda function
│   │   │   ├── app.py            # Lambda handler
│   │   │   ├── send_message.py   # Message sending logic
│   │   │   └── members_card_const.py # Constants
│   │   ├── dynamodb_data/        # Sample product data
│   │   └── template.yaml         # APP SAM template
│   │
│   ├── Batch/                    # Batch job for token renewal
│   │   ├── update_line_access_token/
│   │   │   └── update_line_access_token.py
│   │   └── template.yaml         # Batch SAM template
│   │
│   └── Layer/                    # Shared Lambda Layer
│       ├── layer/
│       │   ├── aws/              # AWS utilities
│       │   │   └── dynamodb/     # DynamoDB base classes
│       │   ├── common/           # Common utilities
│       │   ├── members_card/     # Members card logic
│       │   └── validation/       # Parameter validation
│       └── template.yaml         # Layer SAM template
│
├── front/                        # Frontend - LIFF application
│   ├── index.html               # Main HTML
│   ├── index.js                 # LIFF initialization
│   ├── members_card.js          # Members card logic
│   ├── lang_message/            # i18n translations
│   ├── lib/                     # Libraries (jQuery, barcode)
│   └── message.json             # Message templates
│
├── docs/                        # Documentation
│   ├── en/                      # English docs
│   ├── jp/                      # Japanese docs
│   └── images/                  # Documentation images
│
└── README.md                    # Project overview
```

---

## 3. SAM Template Configuration

The project uses **three separate SAM stacks**:

### 3.1 APP Template (`backend/APP/template.yaml`)

**Main API and database stack:**

- **Lambda Function**: `MembersCard-UserInfoGet-${Environment}`
  - Runtime: Python 3.8
  - Handler: `app.lambda_handler`
  - Memory: Configurable (128-3008 MB)
  - Timeout: 3 seconds

- **API Gateway**:
  - Endpoint: `/members_card` (POST method)
  - Stages: dev, prod

- **DynamoDB Tables**:
  1. **LineMembersCardUserInfo**
     - Partition Key: `userId` (String)
     - Sort Key: `barcodeNum` (Number)
     - GSI: `barcodeNum-index` for barcode lookups
  2. **LineMembersCardProductInfo**
     - Partition Key: `productId` (Number)

- **CloudFront + S3**:
  - S3 bucket for frontend hosting
  - CloudFront distribution for HTTPS delivery
  - Origin Access Identity for secure access

- **IAM Role**: Lambda execution role with:
  - DynamoDB read/write permissions
  - CloudWatch logging permissions

### 3.2 Layer Template (`backend/Layer/template.yaml`)

**Shared Lambda Layer stack:**

- Creates Lambda Layer `LINE-USECASE-MEMBERSCARD-LAYER-${Environment}`
- Runtime: Python 3.8
- Exports layer ARN for use by other functions

### 3.3 Batch Template (`backend/Batch/template.yaml`)

**Token renewal batch job:**

- **DynamoDB Table**: `LINEChannelAccessTokenDB`
  - Stores short-term access tokens
  - Keys: `channelId`

- **Lambda Function**: `MembersCard-PutAccessToken-${Environment}`
  - Updates expired LINE access tokens

- **EventBridge Rule**:
  - Schedule: `cron(0 0 * * ? *)` - Daily at midnight (JST)
  - Triggers token renewal Lambda

---

## 4. Lambda Functions and Their Purposes

### 4.1 Main API Function: `app.py`

**Location**: `backend/APP/members_card/app.py`

**Responsibilities**:
- Validates incoming requests (idToken, mode parameter)
- Extracts user ID from LINE ID Token using LIFF channel
- Routes between two modes:
  - **`init` mode**: Creates new member or retrieves existing member data
  - **`buy` mode**: Simulates product purchase and points award

**Key Operations**:
1. Extracts `userId` from `idToken`
2. For `init`:
   - Checks if user exists in DynamoDB
   - If new, generates unique barcode and creates member record
3. For `buy`:
   - Randomly selects product from product master
   - Calculates points (5% of unit price)
   - Updates user's point balance
   - Sets point expiration date (1 year)
   - Sends electronic receipt as Flex Message via LINE OA

**Environment Variables**:
- `OA_CHANNEL_ID`: LINE Official Account Channel ID
- `LIFF_CHANNEL_ID`: LIFF Channel ID
- `MEMBERS_INFO_DB`: User info table name
- `PRODUCT_INFO_DB`: Product info table name
- `CHANNEL_ACCESS_TOKEN_DB`: Token storage table
- `LOGGER_LEVEL`: DEBUG or INFO

### 4.2 Message Sender: `send_message.py`

**Location**: `backend/APP/members_card/send_message.py`

**Responsibilities**:
- Formats product data for messaging
- Creates Flex Message receipts
- Sends push messages to users via LINE Messaging API

**Key Functions**:
- `send_push_message()`: Sends receipt to user
- `send_service_message()`: Sends service message (supports mini-app notifications)
- `modify_product_obj()`: Transforms database product to display format
- `make_flex_recept()`: Constructs Flex Message with receipt details

**Flex Message Components**:
- Header: Store name, date, disclaimer
- Body: Itemized receipt (price, shipping, fee, tax, total, points)
- Footer: "View Membership Card" button linking to LIFF
- Product image

### 4.3 Batch Function: `update_line_access_token.py`

**Location**: `backend/Batch/update_line_access_token/update_line_access_token.py`

**Responsibilities**:
- Renews expired SHORT-TERM LINE channel access tokens
- Runs daily via EventBridge

**Process**:
1. Scans `LINEChannelAccessTokenDB` table
2. For each channel:
   - Checks if token is expired (within last 20 days)
   - If expired/missing, requests new token from LINE OAuth endpoint
   - Updates token with 20-day expiration limit in DynamoDB

---

## 5. API Endpoints

**Single Main Endpoint**:

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/members_card` | Handles init (membership creation) and buy (purchase simulation) operations |

**Request Format**:
```json
{
  "idToken": "LINE_ID_TOKEN",
  "mode": "init" | "buy",
  "language": "ja"
}
```

**Response Format**:
```json
{
  "userId": "USER_ID",
  "barcodeNum": 1234567890123,
  "point": 1050,
  "pointExpirationDate": "2025/01/31"
}
```

---

## 6. Database and Storage Configurations

### 6.1 DynamoDB Tables

**Table 1: LineMembersCardUserInfo** (Member Data)

| Attribute | Type | Key | Purpose |
|-----------|------|-----|---------|
| userId | String | HASH | LINE user identifier |
| barcodeNum | Number | RANGE | 13-digit barcode (unique) |
| point | Number | - | Current loyalty points |
| pointExpirationDate | String | - | Points validity date |
| createdTime | String | - | Account creation timestamp |
| updatedTime | String | - | Last update timestamp |

**Global Secondary Index**:
- Name: `barcodeNum-index`
- Key: `barcodeNum` (HASH)
- Used for: Checking barcode uniqueness on registration

**Table 2: LineMembersCardProductInfo** (Product Master)

| Attribute | Type | Key | Purpose |
|-----------|------|-----|---------|
| productId | Number | HASH | Product identifier |
| productName | Map | - | Multi-language product name |
| unitPrice | Number | - | Base price (in yen) |
| postage | Number | - | Shipping cost |
| fee | Number | - | Processing fee |
| imgUrl | String | - | Product image URL |

**Table 3: LINEChannelAccessTokenDB** (Token Storage)

| Attribute | Type | Key | Purpose |
|-----------|------|-----|---------|
| channelId | String | HASH | LINE Channel ID |
| channelAccessToken | String | - | Short-term access token |
| limitDate | String | - | Token expiration date |
| updatedTime | String | - | Last update time |
| channelSecret | String | - | Channel secret |

### 6.2 S3 Storage

- **Frontend Bucket**: Hosts LIFF web application
- **Access Control**: CloudFront Origin Access Identity
- **Security**:
  - Block public access
  - Enforce HTTPS (TLS)
  - AES-256 server-side encryption

---

## 7. Dependencies and Technologies

### Backend Dependencies

**Python Packages** (in `requirements.txt`):
- `line-bot-sdk==1.17.0` - LINE Messaging API SDK
  - FlexSendMessage for rich messages
  - Push message functionality

**Third-party Libraries** (implicit):
- `boto3` - AWS SDK for DynamoDB/S3 access
- `requests` - HTTP library for LINE API calls
- `dateutil` - Timezone handling (Asia/Tokyo)
- `json` - JSON serialization
- `logging` - Application logging

### Frontend Dependencies

**Libraries** (in `front/lib/`):
- `jquery-3.5.1.min.js` - DOM manipulation
- `jquery-barcode.js` - Barcode generation
- `glottologist` - i18n translation library
- `LIFF SDK 2.8.0` - LINE Front-end Framework

**Technologies**:
- HTML5 with CSS styling
- Vanilla JavaScript for logic
- LIFF API for LINE integration
- XMLHttpRequest for API communication

### AWS Services

| Service | Purpose |
|---------|---------|
| **Lambda** | Serverless function execution |
| **API Gateway** | REST API endpoint |
| **DynamoDB** | NoSQL database |
| **CloudFront** | CDN for frontend delivery |
| **S3** | Frontend hosting |
| **IAM** | Access control |
| **CloudWatch** | Logging and monitoring |
| **EventBridge** | Scheduled batch jobs |

### LINE APIs Used

| API | Purpose |
|-----|---------|
| **ID Token Verification** | `https://api.line.me/oauth2/v2.1/verify` - Extract user ID |
| **Messaging API** | Push messages, Flex messages to users |
| **OAuth 2.0** | `https://api.line.me/v2/oauth/accessToken` - Token acquisition |

---

## 8. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    User's LINE App (LIFF)                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ members_card.js: Handles UI & member card display       ││
│  │ - Initializes LIFF                                      ││
│  │ - Sends idToken to backend                              ││
│  │ - Displays barcode and points                           ││
│  └─────────────────────────────────────────────────────────┘│
└────────────────┬────────────────────────────────────────────┘
                 │ POST /members_card (idToken, mode)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (AWS)                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Lambda Function: app.py                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ 1. Validate request                                     ││
│  │ 2. Extract userId from idToken using line.py            ││
│  │ 3. Route to init() or buy()                             ││
│  │    - init: Create new member or fetch existing          ││
│  │    - buy: Award points & send receipt                   ││
│  └─────────────────────────────────────────────────────────┘│
└────────┬────────────────────────────────────────────────────┘
         │
    ┌────┴────────────────┬──────────────────┐
    │                     │                  │
    ▼                     ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ DynamoDB:    │  │ Messaging    │  │ Layer Modules│
│ User Info    │  │ API (via     │  │              │
│ Product Info │  │ send_message)│  │- line.py     │
│ Token Store  │  │              │  │- validation  │
└──────────────┘  └──────────────┘  │- dynamodb    │
                                    └──────────────┘
```

**Data Flow for Purchase (`buy` mode)**:
1. Frontend sends idToken and "buy" mode
2. Lambda validates request
3. Lambda queries user record from DynamoDB
4. Lambda randomly selects product from ProductInfo table
5. Lambda calculates points (5% of unit price) + 1 year expiration
6. Lambda updates user record in DynamoDB
7. Lambda retrieves OA access token from Token Store
8. Lambda calls LINE Messaging API to send Flex receipt
9. User receives electronic receipt in LINE chat

**Scheduled Token Renewal**:
1. EventBridge triggers daily at midnight (JST)
2. Batch Lambda queries all channels from Token Store
3. For expired tokens: calls LINE OAuth to get new token
4. Updates token in DynamoDB with 20-day expiration

---

## 9. Key Features and Workflow

### Member Registration (Init Mode)
- First-time users automatically get a unique 13-digit barcode
- Account record created with 0 points and empty expiration date
- Data includes creation/update timestamps

### Points Management
- 5% of unit price awarded on each purchase
- Points have 1-year validity from purchase date
- Multiple purchases extend expiration date
- Updated via DynamoDB UpdateItem (Atomic operation)

### Receipt Generation
- Uses LINE Flex Messages (rich message format)
- Displays: Product name, unit price, shipping, fee, tax, subtotal, total
- Shows: Awarded points, transaction date/time
- Includes: Product image and "View Membership Card" button
- Multi-language support (Japanese in current version)

### Security
- ID Token validation via LINE OAuth
- Channel access token expiration checking
- DynamoDB encryption at rest
- HTTPS enforcement via CloudFront/S3
- IAM least-privilege access

---

## 10. Development and Deployment

### Local Development
- Requires: Python 3.8+, AWS SAM CLI, Docker
- Deploy with: `sam build && sam deploy`
- Dev/Prod environments separated via template parameters

### Frontend Deployment
- LIFF application hosted on S3/CloudFront
- Requires: LIFF ID and Channel credentials configured
- Accessible via: `https://liff.line.me/{LIFF_ID}`

### Configuration
- Environment variables passed via SAM template mappings
- Separate parameters for dev/prod (database names, memory sizes, etc.)
- All credentials stored in SAM parameters (not in code)

---

## 11. Summary

This is a production-ready demo showing best practices for:
- Serverless applications using AWS SAM
- Integration with LINE APIs (LIFF, Messaging API, OAuth)
- Managing membership/loyalty programs
- Multi-stack SAM deployments with shared layers
