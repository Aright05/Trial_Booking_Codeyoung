# Codeyoung Trial Class Booking System

A production-minded, full-stack trial-class booking platform built for the **Codeyoung Trial Class Booking System**.

The system enables parents worldwide (across US, UK, India, and beyond) to book 1:1 live trial sessions with certified mentors with smart timezone synchronization, single free-trial per Gmail account enforcement, fair mentor load balancing (maximum 2 trial classes per mentor per India calendar day), strict zero-overlap concurrency protection, post-commit email notifications (Nodemailer), persistent 1:1 demo class link delivery, a dedicated Mentor Schedule portal, configurable Paid Subscription Plans with demo checkout, and a real-time administrative operations dashboard.

---

## 🚀 Tech Stack

- **Frontend:** React 18 + Vite + JavaScript
- **Styling:** Tailwind CSS + Lucide Icons + Google Fonts (Plus Jakarta Sans)
- **Timezone Engine:** Luxon (IANA timezone database, handling daylight-saving transitions across `Asia/Kolkata`, `Europe/London`, `America/New_York`, and `America/Los_Angeles`)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL with connection pooling (`pg` node-postgres driver)
- **Email Notifications:** Nodemailer with development test transport & Ethereal sandbox support
- **Testing:** Vitest + Supertest (87 automated unit & integration tests across 11 test suites)

---

## 📂 Project Structure

```text
codeyoung-trial-booking/
├── client/                     # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/          # AdminSummaryCards, AdminBookingsTable, AdminMentorsOverview, AdminCancelModal
│   │   │   ├── common/         # Button, Input, Card, Badge, Loading, ErrorState
│   │   │   ├── layout/         # Header (with live navigation and API monitor), Footer
│   │   │   └── booking/        # TimezoneSelector, SlotPicker, BookingForm, BookingSummary, BookingSuccessModal, SubscriptionPlanModal, StepNotice
│   │   ├── config/             # subscriptionPlans.js (Client Pricing Configuration)
│   │   ├── hooks/              # useBookingState (live slots, trial eligibility & booking workflow)
│   │   ├── pages/              # BookingPage, AdminPage, MentorPage
│   │   ├── services/           # api.js client fetch wrapper with Admin, Trial, Subscription, and Mentor APIs
│   │   ├── utils/              # timezones.js (Luxon multi-zone conversions)
│   │   ├── __tests__/          # Vitest frontend tests (timezones, client features, subscription plans)
│   │   ├── App.jsx             # Tri-view routing (Parent Booking, Mentor Schedule & Admin Operations)
│   │   ├── index.css           # Tailwind layers & colorful gradient pattern
│   │   └── main.jsx
│   ├── package.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── .env.example
├── server/                     # Node.js + Express Backend
│   ├── src/
│   │   ├── config/             # constants.js, env.js, postgres.js, initPostgresSchema.js, subscriptionPlans.js
│   │   ├── controllers/        # health.controller.js, mentor.controller.js, slot.controller.js, booking.controller.js, trial.controller.js, mentorSchedule.controller.js, subscription.controller.js, admin.controller.js
│   │   ├── middleware/         # adminAuth.js, mentorAuth.js, errorHandler.js, notFoundHandler.js
│   │   ├── routes/             # health.routes.js, mentor.routes.js, slot.routes.js, booking.routes.js, trial.routes.js, subscription.routes.js, admin.routes.js, index.js
│   │   ├── scripts/            # seedMentors.js, seedPostgresMentors.js (idempotent 10-mentor seed)
│   │   ├── services/           # availability.service.js, booking.service.js, trial.service.js, mentorSchedule.service.js, subscription.service.js, email.service.js, admin.service.js
│   │   ├── utils/              # apiResponse.js, timezone.js, emailNormalizer.js
│   │   ├── __tests__/          # Vitest + Supertest test suites (health, models, booking, timezone, email, admin, trial_and_mentor, subscription)
│   │   ├── app.js              # Express app instance & CORS
│   │   └── server.js           # Server listen on port 5001 & graceful shutdown
│   ├── package.json
│   └── .env.example
├── .gitignore
├── .env.example
├── package.json                # Root workflow scripts
└── README.md
```

---

## 📌 Core Business Rules & Architectures

### 1. Single Free Trial per Gmail Account & Email Normalization
- **Business Rule:** Each parent can claim exactly one free trial per Gmail mailbox, regardless of appointment cancellations or subsequent booking attempts.
- **Normalization Policy (`emailNormalizer.js`):**
  - **Gmail / Googlemail:**
    - Standardizes domain `googlemail.com` to `gmail.com`.
    - Truncates any subaddressing / plus-tags (e.g., `user+test@gmail.com` -> `user@gmail.com`).
    - Strips all internal dots in the local-part username (e.g., `u.s.e.r@gmail.com` -> `user@gmail.com`).
    - Case-insensitively lowercases both username and domain.
  - **Non-Gmail Providers (e.g., Outlook, Yahoo, Proton, Custom Domains):**
    - Preserves internal dots and plus-tags because RFC 5322 allows providers to treat dotted or tagged addresses as distinct mailboxes. Only trims whitespace and lowercases the domain.
- **Persistent Entitlement Guarantee:**
  - Tracked in PostgreSQL table `free_trial_entitlements` with a primary key / unique index on `normalized_email`.
  - Claimed inside an atomic PostgreSQL transaction with row-level locking (`SELECT ... FOR UPDATE` on entitlement).
  - Preserved permanently: even if a booking is cancelled, the entitlement record remains `status = 'claimed'` and cannot be used again.
  - Returns machine-readable HTTP 409 error: `{ "error": { "code": "FREE_TRIAL_ALREADY_USED", "message": "Each parent can use exactly one free trial..." } }`.
- **Identity Caveat:** Email normalization operates on mailbox addresses and does not prove personal physical identity without multi-factor email verification or account authentication.

### 2. Fair Mentor Assignment & Zero Overlap Invariant
- **Assignment Algorithm:**
  - Evaluates all active mentors (`is_active = true`).
  - Strict Overlap Check: Enforces half-open intervals `[startAt, endAt)`. A mentor with an active (non-cancelled) booking during the requested interval is ineligible.
  - Daily Capacity Limit: Maximum 2 trial classes per mentor per India calendar day (`Asia/Kolkata`).
  - Fair Load Strategy: Selects the mentor with the lowest number of scheduled classes on that day (least-loaded), breaking ties using a cryptographically fair randomized selection.
  - Concurrency Protection: If all active mentors are booked for a slot, returns HTTP 409 `NO_MENTOR_AVAILABLE`.
- **Zero-Overlap Database Guarantee:**
  - Supported via PostgreSQL `btree_gist` exclusion constraint: `EXCLUDE USING gist (mentor_id WITH =, tstzrange(start_at, end_at, '[)') WITH &&) WHERE (status != 'cancelled')`.
  - Backed by transaction isolation and transactional validation to ensure no race condition can ever double-book a mentor.
  - Adjacent non-overlapping meetings (e.g., 10:00–10:50 and 10:50–11:40) are safely allowed if daily capacity allows.

### 3. Paid Subscription Plans & Demo Checkout Integration
When a parent's Gmail has already claimed its 1 free trial, the system provides a prominent, clickable **"Explore Paid Subscription Plans"** button in both the Booking Summary and Booking Form.

#### Configured Plans:
- **Plan A: 3-Day Pass**
  - Duration: 3 days (`/ 3 days`)
  - Price: ₹199 (`19900` paise)
  - Features: Trial/demo learning sessions, mentor schedule viewing, booking confirmations, email notifications.
- **Plan B: Monthly Plan**
  - Duration: 30 days (`/ month`)
  - Price: ₹999 (`99900` paise)
  - Features: Eligible learning sessions, mentor schedule viewing, booking management & meeting details, email notifications & confirmations, priority booking.
- **Plan C: Yearly Plan (Best Value)**
  - Duration: 365 days (`/ year`)
  - Price: ₹7,999 (`799900` paise)
  - Features: Full-year curriculum access, mentor schedule viewing, booking management, email confirmations, priority booking.

#### Configuration Locations:
- Server (Source of Truth): [server/src/config/subscriptionPlans.js](file:///d:/study/SIH/Book_Trial_Codeyoung/server/src/config/subscriptionPlans.js)
- Frontend (Client UI): [client/src/config/subscriptionPlans.js](file:///d:/study/SIH/Book_Trial_Codeyoung/client/src/config/subscriptionPlans.js)

#### Plan Selection & Checkout Behavior:
- Clicking **"Choose Plan"** transitions to a plan-confirmation/checkout view showing the selected plan, price, features, and parent information.
- Clicking **"Continue to Payment"** triggers `POST /api/subscriptions/intent`, creating a record in PostgreSQL with `status = 'pending_payment'` and `payment_status = 'demo_pending'`.
- **Security & Validation:** The backend strictly validates `plan_id` and calculates prices using server configuration. Frontend-supplied prices are never trusted.
- **Payment Disclaimer:** Clearly labeled demo checkout placeholder. Subscriptions are created in pending demo state; no real credit card or payment credentials are collected.

### 4. Demo Meeting Link & Booking Confirmation
- **Demo Meeting URL:** Clearly labelled as a demonstration meeting link (`https://meet.codeyoung.com/room/CY-XXXXXX`). No false claims of third-party Google Meet API creation are made.
- **Confirmation Details:** Displays Booking Reference, Mentor's Full Name, Professional Contact Email, Avatar / Initials, Mentor Timezone, Parent Local Date & Time, Mentor Local Date & Time, 50-minute Class Duration, Copy Link action, and "Join Meeting" launcher.

### 5. Mentor Schedule Portal & Private Access
- **Private Route:** `/api/mentor/me/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD`.
- **Authentication:** Authenticates the mentor identity via `x-mentor-email` header or `Authorization: Bearer <mentor-email>`. Mentors can only query and view their own assigned sessions.
- **Frontend Portal (`#mentor`):** Interactive mentor schedule section grouping appointments into **Today**, **Tomorrow**, **Upcoming**, and a custom **Date Picker**, showing real-time capacity usage (e.g. `1 / 2 classes booked today`), parent contact details, meeting status badges, and copy link action.

### 6. Dual-Timezone Email Notifications & Reliability
- **Parent Notification:** Dispatched with localized parent appointment time, mentor's local time, mentor's professional contact email, trial single-use policy notice, and classroom demo link.
- **Mentor Notification:** Dispatched with mentor's local time (`Asia/Kolkata`), parent's local time, parent contact details, classroom demo link, and mentor schedule portal link.
- **Reliability:** Notifications are triggered asynchronously post-commit. Email transport failures are logged to `parent_notified = 'failed'` without rolling back committed database bookings.

---

## 🛠️ Installation & Getting Started

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (v14+) or in-memory fallback for testing

### 2. Environment Configuration
In [server/.env](file:///d:/study/SIH/Book_Trial_Codeyoung/server/.env):
```env
PORT=5001
DATABASE_URL=postgresql://postgres:172005@127.0.0.1:5000/postgres
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Admin Authentication
ADMIN_API_KEY=codeyoung-admin-secret-dev

# Email Service (Nodemailer)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=Codeyoung Trial Classes <no-reply@codeyoung.com>

# Demo Classroom Link Base URL
DEMO_CLASS_BASE_URL=https://meet.codeyoung.com/room
```

In [client/.env](file:///d:/study/SIH/Book_Trial_Codeyoung/client/.env):
```env
VITE_API_BASE_URL=http://localhost:5001/api
```

### 3. Database Migration & Mentor Seeding
Run schema migration and idempotent mentor seed:
```bash
cd server
npm run seed
```

---

## 💻 Running the Application

Open **two separate terminal windows**:

### Terminal 1: Backend Server (Port 5001)
```bash
cd server
npm run dev
```

### Terminal 2: Frontend Client (Port 5173)
```bash
cd client
npm run dev
```

- **Parent Booking Portal:** [http://localhost:5173](http://localhost:5173)
- **Mentor Schedule Portal:** [http://localhost:5173/#mentor](http://localhost:5173/#mentor)
- **Admin Operations Dashboard:** [http://localhost:5173/#admin](http://localhost:5173/#admin)

---

## 📡 API Reference & Endpoints

### Public & Parent Endpoints

#### 1. Check Free Trial Eligibility: `GET /api/trials/eligibility`
**Query Parameters:** `email=parent.name+test@gmail.com`
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "eligible": true,
    "normalizedEmail": "parentname@gmail.com",
    "isClaimed": false,
    "message": "Free trial is available for this Gmail account."
  }
}
```

#### 2. Get Subscription Plans: `GET /api/subscriptions/plans`
**Response (200 OK):**
Returns the 3 configured plans (3-Day Pass, Monthly Plan, Yearly Plan) with durations, features, formatted prices, and prices in paise.

#### 3. Create Subscription Intent (Demo Checkout): `POST /api/subscriptions/intent`
**Request Body:**
```json
{
  "parentName": "Sarah Jenkins",
  "parentEmail": "sarah.jenkins@gmail.com",
  "planId": "monthly",
  "phone": "+91 98765 43210",
  "notes": "Grade 5 student interested in Python"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "subscriptionId": "SUB-20261010-3FA1B2",
    "planId": "monthly",
    "planName": "Monthly Plan",
    "priceFormatted": "₹999",
    "pricePaise": 99900,
    "status": "pending_payment",
    "paymentStatus": "demo_pending",
    "isDemoMode": true
  }
}
```

#### 4. Availability API: `GET /api/slots`
**Query Parameters:**
- `date`: `YYYY-MM-DD` (e.g. `2026-11-20`)
- `timezone`: IANA timezone identifier (`Asia/Kolkata`, `Europe/London`, `America/New_York`, `America/Los_Angeles`)

#### 5. Booking Creation API: `POST /api/bookings`
**Request Body:**
```json
{
  "parentName": "Sarah Jenkins",
  "parentEmail": "sarah.jenkins+trial@gmail.com",
  "parentTimezone": "America/New_York",
  "startAt": "2026-11-20T14:00:00.000Z"
}
```
**Response (201 Created):** Returns full booking record, normalized email, mentor contact email, avatar, local parent/mentor times, and demo classroom URL.

#### 6. Booking Retrieval API: `GET /api/bookings/:id`
```bash
curl "http://localhost:5001/api/bookings/CY-20261120-E4A281"
```

---

### Mentor Portal Endpoints (Protected by `x-mentor-email`)

#### 1. Mentor Private Schedule: `GET /api/mentor/me/schedule`
**Headers:** `x-mentor-email: mentor.rahul@codeyoung.test`
**Query Parameters:** `from=YYYY-MM-DD`, `to=YYYY-MM-DD`

---

### Admin Endpoints (Protected by `x-admin-key: codeyoung-admin-secret-dev`)

#### 1. Operations Statistics: `GET /api/admin/stats`
#### 2. Paginated Bookings: `GET /api/admin/bookings`
#### 3. Mentor Daily Capacity Overview: `GET /api/admin/mentors`
#### 4. Booking Cancellation: `POST /api/admin/bookings/:id/cancel`
#### 5. Retry Notification: `POST /api/admin/bookings/:id/retry-notification`

---

## 🧪 Automated Testing (87 Tests across 11 Suites)

Run all tests across backend and frontend from root:
```bash
npm test
```

Or individually:
```bash
# Backend test suites (76 tests across 8 suites)
npm run test:server

# Frontend test suites (11 tests across 3 suites)
npm run test:client
```

### Test Coverage Highlights:
1. **Subscription Plans & Pricing Suite (`subscription.test.js` - 5 tests):**
   - ✅ Returns all 3 configured plans (3-Day Pass ₹199, Monthly Plan ₹999, Yearly Plan ₹7,999) with duration & features.
   - ✅ Rejects invalid plan ID, invalid parent name, and invalid email.
   - ✅ Creates demo subscription intent in PostgreSQL with server-calculated price in paise and `pending_payment` / `demo_pending` state.
2. **Trial Eligibility & Concurrency (`trial_and_mentor.test.js` - 13 tests):**
   - ✅ Single free trial per Gmail account; duplicate normalized variations (`.`, `+tag`, `googlemail.com`) rejected with 409 `FREE_TRIAL_ALREADY_USED`.
   - ✅ Non-Gmail accounts preserve plus-tags and dots.
   - ✅ Atomic concurrency protection preventing race conditions.
   - ✅ Non-overlapping meetings for the same mentor allowed within daily capacity limit (2 classes/IST day).
   - ✅ Zero-overlap guarantee: concurrent overlapping attempts for the same mentor safely rejected with 409 `NO_MENTOR_AVAILABLE`.
   - ✅ Mentor schedule endpoint isolation and authorization verification.
3. **Booking & Capacity Engine (`booking.test.js` - 12 tests):**
   - ✅ Active mentor filtering, dynamic slot calculations, DST handling, and immediate capacity release on cancellation.
4. **Timezone & DST Suite (`timezone.test.js` - 15 tests):**
   - ✅ US, UK, and India timezone conversions, ambiguous fall-back times, and nonexistent spring-forward times.
5. **Admin Dashboard Suite (`admin.test.js` - 10 tests):**
   - ✅ Real PostgreSQL statistics, key authorization, pagination, and double-cancellation prevention.
6. **Email Service Suite (`email.test.js` - 9 tests):**
   - ✅ Dual-timezone rendering, non-blocking post-commit dispatch, idempotency, and test transport safety.
7. **Client Frontend Suites (`client/src/__tests__/` - 11 tests):**
   - ✅ Subscription plan definitions, pricing values, Best Value badge, and API wrappers.
   - ✅ Timezone calculations, display formatting, and client API service checks.

---

## 🔒 Security & Concurrency Guarantees

- **Parameterized Queries:** Every SQL query uses parameterized placeholders (`$1`, `$2`, etc.) eliminating SQL injection risks.
- **Server-Side Pricing Validation:** Subscription prices are derived exclusively from trusted backend configuration; frontend cannot alter or spoof prices.
- **Database-Level Enforceability:** Unique constraint on `free_trial_entitlements (normalized_email)` and `btree_gist` range exclusion on `bookings (mentor_id, tstzrange(start_at, end_at, '[)'))`.
- **Credential Protection:** Secrets (`DATABASE_URL`, `ADMIN_API_KEY`, `EMAIL_PASS`) stay strictly inside environment variables and are excluded from git.
- **Sanitized Outputs:** Error handling avoids leaking database internals or passwords to the frontend.

---

## ⚠️ Known Limitations & Recruitment MVP Disclosures

- **Payment Integration:** Subscription plans provide plan details, configurable pricing (₹199, ₹999, ₹7,999), and demo checkout intent records in PostgreSQL. No live credit card processing or payment gateway credentials are collected. Subscriptions remain in `pending_payment` / `demo_pending` state.
- **Email Delivery in Dev:** Development uses Nodemailer test transporter or Ethereal sandbox (`EMAIL_HOST=smtp.ethereal.email`). For live email delivery, configure real SMTP credentials in `server/.env`.
- **Demo Meeting Rooms:** Video conference URLs point to configured demo classroom rooms (`meet.codeyoung.com`). No third-party Google Meet OAuth2 integration is claimed.
- **Mentor Authentication:** Mentor portal uses header-based verification (`x-mentor-email` / `Bearer`) appropriate for testing and evaluation.
