# LINE Restaurant Reservation SAM Application Overview

## 1. Project Purpose

This is a **serverless restaurant reservation system** built with AWS Lambda, DynamoDB, and LINE APIs. It enables users to make restaurant reservations directly through a LINE LIFF (LINE Front-end Framework) application integrated into LINE messaging.

**Key Purpose:** Allow restaurant customers to browse restaurants, check availability, select courses, and make reservations, while automatically sending them reminder notifications.

---

## 2. Project Structure

```
line-api-use-case-reservation-Restaurant/
├── backend/
│   ├── APP/                          # API Lambda functions
│   │   ├── shop_list_get/
│   │   ├── shop_calendar_get/
│   │   ├── reservation_time_get/
│   │   ├── course_list_get/
│   │   ├── reservation_put/
│   │   └── dynamodb_data/           # Sample test data (6 restaurants)
│   ├── batch/                        # Batch processing Lambda functions
│   │   ├── messaging_put_dynamo/     # Send scheduled reminder messages
│   │   └── update_line_access_token/ # Token refresh function
│   └── Layer/                        # Lambda Layer with shared libraries
│       └── layer/
│           ├── aws/dynamodb/        # DynamoDB base class
│           ├── common/              # Common utilities (LINE API, messages)
│           ├── restaurant/          # Data models
│           └── validation/          # Parameter validation
├── front/                            # Nuxt.js frontend (Vue.js)
│   ├── pages/                        # Reservation flow pages
│   ├── plugins/                      # LIFF integration
│   └── components/                   # UI components
└── docs/                             # Setup documentation (JP & EN)
```

---

## 3. SAM Template Configuration

The system uses **3 separate SAM templates** deployed together:

### 3.1 Layer Stack (`backend/Layer/template.yaml`)

- **Purpose:** Shared Lambda Layer containing common dependencies
- **Components:**
  - Python 3.8 runtime
  - LINE Bot SDK and utilities
  - DynamoDB helper classes
  - Shared validation logic
- **Exports:** `RestaurantLayerDev` for reuse across Lambda functions

### 3.2 APP Stack (`backend/APP/template.yaml`)

- **Purpose:** API Gateway + Lambda functions for reservation flow
- **Resources:**
  - **API Gateway:** RESTful endpoints (CORS enabled)
  - **3 DynamoDB Tables:**
    - `RestaurantShopMaster` - Restaurant/course information
    - `RestaurantShopReservation` - Daily reservation calendar
    - `RestaurantReservationInfo` - Customer reservations
  - **5 Lambda Functions:** Handles core reservation operations
  - **CloudFront Distribution** - Frontend CDN with S3 origin
  - **S3 Bucket** - Frontend static assets
- **TTL Support:** Optional automatic deletion of reservation data after X days
- **Parameters:** Dev/Prod environment switching

### 3.3 Batch Stack (`backend/batch/template.yaml`)

- **Purpose:** Scheduled background jobs
- **Resources:**
  - **2 Lambda Functions:** Message sending & token refresh
  - **2 DynamoDB Tables:**
    - `LINEChannelAccessTokenDB` - Stores LINE channel tokens
    - `RemindMessageTable` - Stores reminder messages to be sent
  - **EventBridge Rules:** Scheduled CRON jobs
    - Token refresh: Daily at 00:00 JST
    - Message sending: Daily at 01:00 JST

---

## 4. Lambda Functions and Their Purposes

### API Functions (`backend/APP/`)

| Function | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| **ShopListGet** | `/shop_list_get` | GET | Retrieves all restaurants grouped by area |
| **ShopCalendarGet** | `/shop_calendar_get` | GET | Gets vacancy status for specific month (shows booked dates) |
| **ReservationTimeGet** | `/reservation_time_get` | GET | Lists 30-min time slots with booking details for a specific date |
| **CourseListGet** | `/course_list_get` | GET | Gets menu courses for a restaurant with pricing |
| **ReservationPut** | `/reservation_put` | POST | **CORE:** Creates reservation, stores it, and queues reminder messages |

### Batch Functions (`backend/batch/`)

| Function | Trigger | Purpose |
|----------|---------|---------|
| **UpdateLineAccessToken** | EventBridge (daily 00:00 JST) | Refreshes SHORT-LIVED LINE channel tokens before expiration |
| **MessagingPutDynamo** | EventBridge (daily 01:00 JST) | Sends queued reminder messages via LINE Push API |

---

## 5. API Endpoints and Flow

### Reservation Flow

```
1. User opens LIFF in LINE
   ↓
2. GET /shop_list_get
   ← Returns: [{ areaId, areaName, shops[] }]
   ↓
3. User selects shop & date
   ↓
4. GET /shop_calendar_get?shopId=1&preferredYearMonth=2024-01
   ← Returns: { reservedYearMonth, reservedDays: [{day, vacancyFlg}] }
   ↓
5. User selects date
   GET /reservation_time_get?shopId=1&preferredDay=2024-01-15
   ← Returns: [{ reservedStartTime, reservedEndTime, reservedNumber }]
   ↓
6. GET /course_list_get?shopId=1
   ← Returns: [{ courseId, courseName, price, courseMinutes }]
   ↓
7. User submits reservation form
   POST /reservation_put
   Body: {
     shopId, shopName, courseId, courseName,
     reservationDate, reservationStarttime, reservationEndtime,
     reservationPeopleNumber, userName, idToken
   }
   ← Returns: { reservationId }
   ↓
8. Reminder messages queued and sent on schedule
```

---

## 6. Database Schemas

### RestaurantShopMaster Table (Shop Information)

```
Primary Key: shopId (Number)
Attributes:
  - areaId, areaName (region grouping)
  - shop: {
      shopId, shopName, shopAddress, shopTel,
      openTime, closeTime, seatsNumber,
      averageBudget, smokingFlg, closeDay,
      coordinate: {latitude, longitude},
      imageUrl, lineAccountUrl, displayOrder
    }
  - course[]: [{ courseId, courseName, price, courseMinutes, comment }]
```

### RestaurantShopReservation Table (Calendar/Availability)

```
Primary Key: shopId (Number), reservedDay (String: YYYY-MM-DD)
Global Secondary Index: shopId-reservedYearMonth-index (for monthly queries)
Attributes:
  - reservedYearMonth (YYYY-MM) - for GSI
  - reservedInfo[]: [{ reservedStartTime, reservedEndTime, reservedNumber }]
  - totalReservedNumber, vacancyFlg (0=full, 1=available, 2=few seats)
  - expirationDate (TTL: auto-delete old reservations)
  - timestamps: createdTime, updatedTime
```

### RestaurantReservationInfo Table (Customer Reservations)

```
Primary Key: reservationId (String: UUID)
Attributes:
  - shopId, shopName, userId, userName
  - courseId, courseName, reservationPeopleCount
  - reservationDate, reservationStarttime, reservationEndtime
  - amount (course price)
  - expirationDate (TTL), timestamps
```

### LINEChannelAccessTokenDB Table (Token Storage)

```
Primary Key: channelId (String)
Attributes:
  - channelAccessToken, channelSecret
  - limitDate (when token expires)
  - timestamps
```

### RemindMessageTable (Reminder Queue)

```
Primary Key: id (String: UUID)
Global Secondary Index: remindDate-index
Attributes:
  - remindDate (YYYY-MM-DD) - used for daily batch queries
  - messageInfo: { messageType, userId, channelId, messageBody (flex message JSON) }
  - remindStatus, expirationDate (TTL)
```

---

## 7. Dependencies and Technologies

### Backend Stack

- **Python 3.8** - Lambda runtime
- **boto3** - AWS SDK
- **line-bot-sdk (1.17.0)** - LINE Messaging API
- **requests** - HTTP client
- **dateutil** - Date/time utilities
- **uuid** - ID generation
- **decimal** - DynamoDB decimal handling

### Frontend Stack

- **Nuxt.js 2.13.3** - Vue.js framework
- **@nuxtjs/axios** - API calls
- **AWS Amplify** - Authentication/AWS integration
- **vue-i18n** - Internationalization (JP/EN)
- **Vuetify** - Material Design UI
- **Bootstrap** - Layout framework
- **FontAwesome & MDI** - Icons

### AWS Services

| Service | Purpose |
|---------|---------|
| **Lambda** | Serverless compute |
| **DynamoDB** | NoSQL database |
| **API Gateway** | REST API management |
| **CloudFront** | CDN for frontend |
| **S3** | Static asset hosting |
| **EventBridge** | Scheduled batch jobs |
| **IAM** | Access control |

---

## 8. Reservation Flow in Detail

### User Journey

1. Opens LINE app → Taps restaurant LIFF link
2. LIFF plugin initializes user authentication via LINE
3. Browses restaurants by area (ShopListGet)
4. Selects restaurant, views calendar for specific month (ShopCalendarGet)
5. Clicks available date, sees time slots (ReservationTimeGet)
6. Selects course with pricing (CourseListGet)
7. Completes form with party size, name, timing
8. Submits reservation (ReservationPut)

### Backend Operations on Reservation

1. **User Authentication:** Validates idToken with LINE
2. **Parameter Validation:** Checks all input fields (custom validation class)
3. **Shop Data Retrieval:** Loads restaurant info for capacity calculations
4. **Booking Logic:**
   - Divides reservation into 30-minute slots
   - Calculates seat capacity: (seat count) × (time slots during hours)
   - Updates daily vacancy flag based on occupancy ratio
5. **Data Storage:**
   - Stores customer reservation in `RestaurantReservationInfo`
   - Updates/inserts day-level booking in `RestaurantShopReservation`
6. **Reminder Scheduling:**
   - Creates 2 reminder messages:
     - 1 for day-before (at configured date difference, e.g., -1)
     - 1 for reservation day (at 00:00)
   - Stores as flex messages in `RemindMessageTable`
   - Messages are sent via background batch job daily at 01:00 JST

### Token Refresh Process

1. Daily at 00:00 JST, EventBridge triggers `PutAccessToken` Lambda
2. Scans all LINE channels in token table
3. For each channel:
   - Checks if token is expired
   - If expired or missing: requests new short-lived token from LINE API
   - Updates token table with 20-day expiration
4. Allows messaging functions to always have valid tokens

### Message Sending Process

1. Daily at 01:00 JST, EventBridge triggers `MessagingPut` Lambda
2. Queries `RemindMessageTable` for today's reminders (by remindDate index)
3. For each message:
   - Retrieves user ID and channel info
   - Gets current access token from token table
   - Sends LINE Push Message with Flex Message format
   - Continues on error to process remaining messages
4. Messages include:
   - Restaurant name, date/time, course, party size
   - Reminder text (day before vs. same day)
   - Nice formatting with LINE Flex Message layout

---

## 9. LINE API Integrations

| API | Purpose | Function |
|-----|---------|----------|
| **LINE Messaging API** | Send push notifications | `line.send_push_message()` |
| **LINE LIFF** | Web app in LINE | Frontend: `liff.init()`, `liff.getProfile()`, `liff.getIDToken()` |
| **ID Token Validation** | Verify user identity | `line.get_profile(idToken, liffChannelId)` |
| **Access Token API** | Get/refresh tokens | `update_line_access_token.py` |

**Key Features:**
- Short-lived access tokens (20-day expiration)
- ID token validation for user authentication
- Flex Message format for rich reminder notifications
- Push messaging to send reminders before visit

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      LINE USER                              │
└────────────────────┬────────────────────────────────────────┘
                     │ Opens LIFF
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Frontend (Nuxt.js + Vue.js + AWS Amplify)           │
│  ├─ Pages: areas, shops, calendar, courses, completion      │
│  ├─ LIFF Plugin: Auth, token management, profile            │
│  └─ Components: Forms, calendar UI, error handling          │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS Calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         AWS API Gateway (CORS Enabled)                      │
└────┬────────┬────────────┬───────────────┬──────────────────┘
     │        │            │               │
     ▼        ▼            ▼               ▼
┌───────────┐┌───────────┐┌──────────────┐┌──────────┐
│ShopListGet││Calendar   ││ReservationTime││CourseList│
│ Lambda    ││Get Lambda ││Get Lambda     ││Lambda    │
└───────────┘└───────────┘└──────────────┘└──────────┘
     │        │            │               │
     └────────┴────────────┴───────────────┴──────────────┐
              │ Query                                      │
              ▼                                            │
    ┌──────────────────────────────────────┐              │
    │   RestaurantShopMaster Table         │              │
    │   (Shop & course info)               │              │
    └──────────────────────────────────────┘              │
                                                          │
              ┌─────────────────────────────────────┐     │
              │ RestaurantShopReservation Table     │◄────┘
              │ (Daily calendar/availability)       │
              └─────────────────────────────────────┘
                     ▲
                     │ Update
                     │
            ┌────────┴──────────────┐
            │                       │
    ┌───────▼────────┐    ┌────────▼──────┐
    │ ReservationPut │    │ RemindMessages │
    │    Lambda      │    │    Lambda      │
    └────────────────┘    └────────────────┘
            │
            ├─ Stores reservation
            ├─ Creates reminder messages
            └─ Queues push notifications
                        ▲
                        │ Scheduled (01:00 JST)
                        │
            ┌───────────┴──────────────┐
            │    EventBridge Rules     │
            │  (CRON scheduling)       │
            └───────────┬──────────────┘
                        │
            ┌───────────┴──────────────┐
            │    Batch Functions       │
            │  • Token refresh (00:00) │
            │  • Message send (01:00)  │
            └──────────────────────────┘
                        │
    ┌───────────────────┤
    │                   │
    ▼                   ▼
┌──────────────┐  ┌─────────────────────┐
│  Access      │  │  RemindMessageTable │
│  Token Table │  │  (message queue)    │
└──────────────┘  └─────────────────────┘
    │
    ├─ Fetches current token
    │
    ▼
┌──────────────────────────────────────┐
│      LINE Messaging API              │
│  (Push reminder notifications)       │
└──────────────────────────────────────┘
    │
    ▼
┌──────────────────────────────────────┐
│      User's LINE Chat                │
│  (Receives reservation reminder)     │
└──────────────────────────────────────┘
```

---

## 11. Key Features and Capabilities

### Core Features

- Multi-restaurant support with area grouping
- Real-time availability checking with 30-minute granularity
- Flexible course selection with pricing
- Party size accommodation (seat capacity management)
- Unique reservation IDs for tracking
- Timezone-aware operations (Asia/Tokyo)

### Reminder System

- Configurable reminder day (e.g., day before = -1)
- Dual reminders: day-before + reservation day
- Rich formatting using LINE Flex Messages
- Automatic token refresh to ensure delivery
- TTL support to auto-delete old data

### Multi-Environment Support

- Dev/Prod parameter switching
- Configurable Lambda memory & timeout
- Optional access logging to S3
- TTL control for data retention

### Error Handling & Validation

- Comprehensive parameter validation
- Graceful batch processing (continues on errors)
- Exception logging with context
- HTTP status codes (400 for validation, 403 for auth, 500 for errors)

### Frontend Features

- Bilingual UI (Japanese & English) via vue-i18n
- Responsive design with Vuetify Material Design
- LIFF integration for seamless LINE experience
- AWS Amplify for authentication
- LocalStorage caching for performance

---

## 12. Deployment and Configuration

### Environment Variables (Configurable via template.yaml)

| Variable | Purpose |
|----------|---------|
| `SHOP_INFO_TABLE` | Shop master data table |
| `SHOP_RESERVATION_TABLE` | Calendar/availability table |
| `CUSTOMER_RESERVATION_TABLE` | Customer reservations |
| `MESSAGE_DB` | Reminder message queue |
| `CHANNEL_ACCESS_TOKEN_DB` | Token storage |
| `REMIND_DATE_DIFFERENCE` | Days before reservation for reminder (e.g., -1) |
| `TTL` | Enable/disable auto-deletion of reservation data |
| `TTLDay` | Days to retain data before deletion |
| `LOGGER_LEVEL` | DEBUG or INFO |
| `LambdaMemorySize` | 128-3008 MB |

---

## 13. Comparison with Members Card Application

| Feature | Members Card | Restaurant Reservation |
|---------|--------------|------------------------|
| **Frontend** | Plain HTML/JS | Nuxt.js (Vue.js) |
| **API Endpoints** | 1 (multi-mode) | 5 (separate functions) |
| **DynamoDB Tables** | 3 | 5 |
| **Batch Jobs** | 1 (token refresh) | 2 (token + messaging) |
| **Reminder System** | No | Yes (day-before + same-day) |
| **i18n Support** | Basic | Full (vue-i18n) |
| **Complexity** | Simple | More complex |

---

## 14. Summary

This comprehensive LINE API reservation system demonstrates a production-ready serverless architecture combining:

- Event-driven scheduling for reminders
- Real-time API handling for reservations
- Rich messaging notifications via LINE Flex Messages
- Modern web frontend with Nuxt.js/Vue.js
- Scalable, maintainable design leveraging AWS managed services
