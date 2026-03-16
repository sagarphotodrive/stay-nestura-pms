# Stay Nestura Properties Management System

A comprehensive Channel Manager (CM) and Property Management System (PMS) for managing a 6-listing portfolio in Solapur. Built with Node.js, PostgreSQL, and React.

## Features

### Core Modules

- **Real-Time Channel Manager**: Two-way API integration with Airbnb and Booking.com with 30-second sync
- **Property Management System**: Full CRUD operations for 6 properties
- **Booking Engine**: Smart conflict detection, automatic commission calculation
- **Guest CRM**: Guest profiles with lifetime value tracking, encrypted ID storage
- **Expense Ledger**: Categorized expenses with property tagging
- **Financial Reports**: Monthly P&L, revenue breakdowns, occupancy analytics

### Technical Highlights

- **Real-time Sync**: Socket.IO for instant updates across all clients
- **Security**: AES-256 encryption for sensitive guest data
- **Webhook Integration**: Event-driven architecture for OTA bookings
- **Mobile-First Design**: Responsive UI optimized for on-the-go management

## Property Portfolio

1. Torna Homestay
2. Shivneri Homestay
3. Rajlakshmi Niwas
4. Solapur Homestay 1
5. Budget Room 1
6. Budget Room Deluxe

## Tech Stack

- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Real-time**: Socket.IO
- **Frontend**: React
- **Authentication**: JWT

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

### 1. Clone the repository

```bash
cd "c:/Users/ashut/Downloads/BDC Project/BDC Project"
```

### 2. Install backend dependencies

```bash
npm install
```

### 3. Configure environment variables

Edit `.env` file with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stay_nestura
DB_USER=postgres
DB_PASSWORD=your_password
```

### 4. Initialize database

```bash
npm run db:init
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server

```bash
npm start
```

Server runs on http://localhost:5000

### Start Frontend Development Server

```bash
cd frontend
npm start
```

Frontend runs on http://localhost:3000

## API Endpoints

### Properties
- `GET /api/properties` - List all properties
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property
- `PUT /api/properties/:id` - Update property
- `GET /api/properties/:id/calendar` - Get availability calendar

### Bookings
- `GET /api/bookings` - List bookings with filters
- `GET /api/bookings/today` - Today's check-ins/check-outs
- `POST /api/bookings` - Create booking (with conflict detection)
- `PATCH /api/bookings/:id/status` - Update booking status

### Guests (CRM)
- `GET /api/guests` - List/search guests
- `GET /api/guests/:id` - Guest profile with history
- `POST /api/guests` - Create/update guest

### Expenses
- `GET /api/expenses` - List expenses
- `GET /api/expenses/summary` - Expense summary by category
- `POST /api/expenses` - Add expense

### Reports
- `GET /api/reports/profit-loss` - Monthly P&L report
- `GET /api/reports/daily-brief` - Daily operations brief
- `GET /api/reports/dashboard` - Dashboard statistics

### Channel Manager
- `GET /api/channel-manager/availability` - Cross-channel availability
- `POST /api/channel-manager/push/availability` - Push ARI to OTAs
- `POST /api/channel-manager/sync/all` - Full sync

### Webhooks
- `POST /api/webhooks/airbnb` - Airbnb webhook handler
- `POST /api/webhooks/booking` - Booking.com webhook handler

## Demo Credentials

```
Email: demo@nestura.com
Password: password
```

## Project Structure

```
├── backend/
│   ├── config/
│   │   └── database.js       # PostgreSQL connection
│   ├── routes/
│   │   ├── auth.js           # Authentication
│   │   ├── bookings.js       # Booking management
│   │   ├── channelManager.js # Channel sync
│   │   ├── expenses.js       # Expense tracking
│   │   ├── guests.js         # Guest CRM
│   │   ├── properties.js     # Property CRUD
│   │   ├── reports.js        # Financial reports
│   │   └── webhooks.js       # OTA webhooks
│   └── scripts/
│       └── initDb.js         # Database initialization
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js            # Main React app
│       ├── index.js          # Entry point
│       └── index.css         # Styles
├── server.js                 # Express server
├── package.json
├── .env                      # Environment config
└── README.md
```

## Key Features Detail

### Real-Time Channel Manager
- Webhook listeners for Airbnb and Booking.com
- Automatic availability blocking across all properties
- Bulk ARI (Availability, Rate, Inventory) updates
- Smart conflict detection with PostgreSQL row-level locking

### Financial Engine
- Automatic commission calculation per channel (Airbnb: 3%, Booking.com: 15%)
- Expense categorization (Laundry, Electricity, Staff, Maintenance, etc.)
- Monthly P&L per property with occupancy metrics

### Guest Communication
- Automated booking confirmation messages
- Pre-arrival digital check-in forms
- Post-departure thank you messages with review links

### Digital Guest Register
- Encrypted ID proof storage (AES-256)
- Lifetime value tracking
- Booking history across all properties
- VIP guest tagging

## License

MIT License
