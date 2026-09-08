# Stay Nestura Properties Management System

A Property Management System (PMS) for managing a small homestay/bungalow portfolio. Built with Node.js/Express and React, backed by MongoDB (with an automatic in-memory fallback for local development).

## Features

### Core Modules

- **Property Management**: CRUD for properties, availability calendars, date blocking, per-date rate overrides
- **Booking Engine**: Conflict detection against existing bookings, per-day-rate × nights amount validation, status workflow (confirmed → checked-in → checked-out / cancelled), partial payment tracking
- **Guest CRM**: Guest profiles with lifetime value and stay-count tracking, guest search, VIP list
- **Expense Ledger**: Categorized expenses with property tagging, monthly summaries, and auto-recurring expenses (e.g. rent) that regenerate every month on a configured day, backfilling any months that were missed
- **Financial Reports**: Dashboard KPIs, monthly P&L, occupancy, ADR, channel profitability, guest analytics, payment summaries
- **iCal Sync**: Per-property iCal feed (`/api/properties/:id/ical.ics`) plus importable external iCal links, for keeping availability in sync with other calendars
- **PDF/CSV Export**: Booking invoices and report exports generated client-side with jsPDF; server-side CSV export for bulk data

### Technical Highlights

- **Real-time updates**: Socket.IO broadcasts booking/property changes to connected clients
- **Scheduled jobs**: `node-cron` drives the recurring-expense generator
- **JWT authentication**: bcrypt-hashed passwords, JWT-based login/register/refresh

## Tech Stack

- **Backend**: Node.js + Express (single-file API in `server.js`)
- **Database**: MongoDB (Mongoose) via `MONGODB_URI`; falls back to an in-memory data store when unset, which is convenient for local dev but does **not** persist across restarts
- **Real-time**: Socket.IO
- **Frontend**: React (Create React App)
- **Authentication**: JWT (`backend/routes/auth.js`)

## Prerequisites

- Node.js 18+
- A MongoDB connection string (MongoDB Atlas or self-hosted) — optional for local development, required for anything you want to persist
- npm

## Installation

### 1. Clone the repository

```bash
git clone <repo-url>
cd stay-nestura-pms
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string   # optional — omit to run on the in-memory store
JWT_SECRET=a_long_random_string               # required in production; falls back to a weak default if unset
FRONTEND_URL=http://localhost:3000
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Start the backend

```bash
npm start          # or: npm run dev  (nodemon, auto-restart)
```

Server runs on `http://localhost:5000`.

### Start the frontend

```bash
cd frontend
npm start
```

Frontend runs on `http://localhost:3000`.

## API Endpoints

All routes live under `/api` and are implemented directly in `server.js`.

### Properties
- `GET /api/properties` / `GET /api/properties/:id` / `POST /api/properties` / `PUT /api/properties/:id` / `DELETE /api/properties/:id`
- `GET /api/properties/:id/calendar` — availability calendar
- `POST /api/properties/:id/block` — block a date range
- `POST /api/properties/:id/rates` — per-date rate overrides
- `GET /api/properties/:id/ical.ics` — iCal feed for the property

### Bookings
- `GET /api/bookings` (filterable) / `GET /api/bookings/:id` / `POST /api/bookings` / `PUT /api/bookings/:id` / `DELETE /api/bookings/:id`
- `GET /api/bookings/today` — today's check-ins/check-outs/current stays
- `GET /api/bookings/check-availability` — conflict check before creating a booking
- `GET /api/bookings/stats/overview` — monthly booking stats
- `PATCH /api/bookings/:id/status` — status transitions
- `PATCH /api/bookings/:id/payment` — record a payment
- `POST /api/bookings/:id/cancel`

### Guests (CRM)
- `GET /api/guests` (search/paginated) / `GET /api/guests/:id` / `POST /api/guests` / `PUT /api/guests/:id` / `DELETE /api/guests/:id`
- `GET /api/guests/search/query`, `GET /api/guests/vip/list`, `GET /api/guests/stats/summary`

### Expenses
- `GET /api/expenses` / `POST /api/expenses` / `POST /api/expenses/bulk` / `PUT /api/expenses/:id` / `DELETE /api/expenses/:id`
- `GET /api/expenses/summary`, `GET /api/expenses/categories`
- `POST /api/expenses/run-recurring` — manually trigger the recurring-expense generator instead of waiting for the daily job

### Reports
- `GET /api/reports/dashboard`, `/profit-loss`, `/daily-brief`, `/revenue`, `/kpi-metrics`, `/channel-profitability`, `/guest-analytics`, `/payment-summary`, `/adr`

### iCal / Channel status
- `GET /api/ical-links`, `POST /api/ical-links`, `DELETE /api/ical-links/:id` — external calendars imported for availability sync
- `GET /api/channel-manager/*`, `POST /api/webhooks/*` — channel-account and sync-status views. **Note:** these currently return simulated success responses rather than talking to real Airbnb/Booking.com APIs; there is no live OTA integration yet.

### Auth
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`

## Project Structure

```
├── backend/
│   ├── config/
│   │   ├── database.js       # In-memory fallback store + mock query engine
│   │   └── mongoose.js       # MongoDB connection
│   ├── models/                # Mongoose schemas
│   ├── routes/
│   │   └── auth.js           # The only route module actually mounted by server.js
│   └── scripts/
│       └── initDb.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.js            # All pages/components (Dashboard, Properties, Bookings, Guests, Expenses, Reports, ...)
│       ├── index.js
│       └── index.css
├── server.js                  # Express app — properties/bookings/guests/expenses/reports routes live here
├── package.json
└── README.md
```

## Known Limitations / Roadmap

- No automated test coverage yet.
- No live OTA (Airbnb/Booking.com) API integration — the channel-manager and webhook endpoints are stubs; iCal import/export is the real sync mechanism today.
- Guest ID-proof fields exist in the schema but are not currently encrypted at rest.
- `frontend/src/App.js` holds every page in one file; splitting it into per-page modules is planned.

## License

MIT License
