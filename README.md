# ShopVault - Modern Full-Stack E-Commerce Platform

[![PHP Version](https://img.shields.io/badge/PHP-8.3-777BB4?logo=php&logoColor=white)](https://php.net)
[![Laravel Framework](https://img.shields.io/badge/Laravel-13.x-FF2D20?logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com)
[![Redis](https://img.shields.io/badge/Redis-7.x-DC382D?logo=redis&logoColor=white)](https://redis.io)
[![Stripe API](https://img.shields.io/badge/Stripe-SDK_v20-635BFF?logo=stripe&logoColor=white)](https://stripe.com)
[![Tests](https://img.shields.io/badge/Tests-49%20Passed%20(100%25)-brightgreen?logo=php&logoColor=white)](tests/)

An enterprise-grade, high-performance E-Commerce platform built with a **Laravel 13 REST API backend** and a **React 19 single-page frontend (SPA)**. Designed with strict domain layers, concurrency safeguards, transactional integrity, and comprehensive management dashboards for customers and store administrators.

---

## 🚀 Key Features

### 🛒 Customer Storefront & Catalog
- **Product Discovery**: Fast catalog filtering by price range, active status, search keywords, and sorting (price, popularity, newest).
- **Cursor Pagination & Infinite Load**: Efficient pagination that scales smoothly with large catalogs.
- **Micro-Animations & Responsive UI**: Fluid animations powered by Framer Motion and modern styling with Tailwind CSS 4.
- **Dynamic SEO Metadata**: Per-page titles and meta tags handled dynamically with clean route-level hooks.

### ⚡ Cart & Concurrency-Safe Checkout
- **Transactional Row Locking**: Prevents overselling during high-concurrency checkouts using database pessimistic row locks (`SELECT ... FOR UPDATE`).
- **Idempotency Protection**: Custom `EnsureIdempotencyKey` middleware and header (`X-Idempotency-Key`) to prevent double-charging on network retries.
- **Dual Checkout Paths**: Supports both multi-item cart checkouts and instantaneous single-item **"Buy Now"** transactions.
- **Optimistic Cart Updates & Caching**: Fast badge counts with Redis-backed cart caching and stampede prevention (`Cache::lock`).

### 💳 Stripe Payments & Webhook Reconciliation
- **PaymentIntent Lifecycle**: Direct integration with Stripe's Elements SDK.
- **Security by Design**: The ephemeral `client_secret` is never persisted in the database; it is returned in-memory directly to the checkout flow.
- **Resilient Webhook Handler**: Cryptographically verified Stripe webhook signatures (`Stripe-Signature`) with automatic order/payment reconciliation.
- **Order Cancellation & Stock Restoration**: Integrated cancellation flow restoring inventory with compensating transactions.

### 📊 Customer & Admin Dashboards
- **Customer Dashboard**: Track recent orders, view lifetime spending, download receipt summaries, and manage account details.
- **Admin Control Center**:
  - **Analytics**: Real-time sales totals, revenue summaries, user growth metrics, and top-performing products.
  - **Order Management**: Filter, inspect order line items, and transition fulfillment/payment statuses.
  - **Catalog Management**: Full CRUD for products, SKU tracking, stock management, and instant activation toggles.
- **Role-Based Access Control**: Protected by `EnsureAdmin` backend middleware and frontend `AdminRoute` guards.

---

## 🏛️ System Architecture

The backend adheres to a **Strict Layered Architecture** ensuring complete separation of concerns:

```
[ Client / SPA (React 19) ]
         │
         ▼
[ Nginx Reverse Proxy (Port 8000) ]
         │
         ▼
[ Laravel Routing & Middleware ]
  ├── Sanctum Auth (Bearer Token)
  ├── Rate Limiting (Throttle)
  └── Idempotency Guard (24h Cache)
         │
         ▼
[ Form Requests (Validation Layer) ]
         │
         ▼
[ Thin Controllers (Orchestration Only) ]
         │
         ▼
[ Actions & Services (Domain Business Logic) ]
  ├── CreateOrderAction (Pessimistic Locks + Transactions)
  ├── ProcessPaymentAction (Stripe PaymentIntents)
  └── CartCacheService (Redis Stampede Prevention)
         │
   ┌─────┴─────────────────┬──────────────────┐
   ▼                       ▼                  ▼
[ MySQL 8.0 ]        [ Redis 7 Cache ]   [ Stripe API ]
 (ACID Storage)       (Queues & State)   (Payment Gateway)
```

---

## 🛠️ Technology Stack

| Layer | Technology | Description |
|---|---|---|
| **Backend Framework** | Laravel 13 | PHP 8.3 with API-first routing and Sanctum token authentication |
| **Frontend Framework** | React 19 + Vite | Fast client-side rendering with Tailwind CSS 4 & Lucide Icons |
| **State & Cache** | Redis 7 & MySQL 8.0 | High-speed cache, background queue broker, and relational storage |
| **Payment Gateway** | Stripe SDK (v20) | PaymentIntents API with webhook signature verification |
| **State Management** | Zustand & React Query | Optimistic updates, persistent auth, and server-state caching |
| **Testing** | PHPUnit 12 | In-memory SQLite test suite covering feature and integration flows |
| **Containers** | Docker & Docker Compose | Multi-container development and production orchestration |

---

## 📁 Repository Structure

```
ecommerce/
├── backend/                   # Standalone Laravel 13 API Application
│   ├── app/                   # Controllers, Form Requests, Actions, Models
│   │   ├── Actions/           # Domain operations (Cart, Order, Payment)
│   │   ├── Http/              # Controllers (Auth, Api, Admin) & Middleware
│   │   ├── Models/            # Eloquent ORM Models (User, Order, Product, etc.)
│   │   └── Services/          # External integrations (Stripe, CartCache)
│   ├── bootstrap/             # App initialization & middleware aliases
│   ├── config/                # Application, CORS, and Sanctum configs
│   ├── database/              # Migrations, seeders, and factories
│   ├── docker/                # PHP-FPM, Nginx, and MySQL container configs
│   ├── public/                # index.php web server entrypoint
│   ├── routes/                # REST API route definitions (api.php)
│   ├── storage/               # Framework storage, cache, and logs
│   ├── tests/                 # PHPUnit feature and unit tests (49 passing)
│   ├── artisan                # Laravel CLI executable
│   ├── composer.json          # Backend dependencies & scripts
│   └── .env.example           # Backend environment template
├── frontend/                  # Standalone React 19 + Vite SPA
│   ├── src/
│   │   ├── api/               # Axios API clients (auth, admin, cart, orders)
│   │   ├── components/        # Reusable UI (AdminLayout, Header, Cards, Modals)
│   │   ├── hooks/             # Custom React hooks (useAdmin, useAuth, usePageTitle)
│   │   ├── pages/             # Route pages (Home, Products, Cart, Orders, Admin/*)
│   │   ├── store/             # Zustand stores (authStore)
│   │   └── styles/            # Page-specific CSS and design tokens
│   ├── package.json           # Frontend dependencies & scripts
│   ├── vite.config.js         # Vite bundler configuration
│   └── .env.example           # Frontend environment template (VITE_API_URL)
├── docker-compose.yml         # Root local orchestration (App, Nginx, MySQL, Redis, Queue)
├── .gitignore                 # Unified gitignore for both projects
└── README.md                  # Project overview & documentation
```

---

## ⚡ Getting Started

### Option A: Docker (Recommended)

Make sure [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) are installed.

1. **Clone the repository and prepare environment files**:
   ```bash
   git clone https://github.com/wasimsaher/ecommerce.git
   cd ecommerce
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Start the containers**:
   ```bash
   docker compose up -d
   ```

3. **Initialize the database & generate application key**:
   ```bash
   docker compose exec app php artisan key:generate
   docker compose exec app php artisan migrate --seed
   ```

4. **Start the Frontend Development Server**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Access the application**:
   - **Backend API**: `http://localhost:8001/api`
   - **Frontend App**: `http://localhost:5173`
   - **Admin Account**: `admin@shopvault.com` / `password`

---

## 🚀 Deployment Guide

Because the frontend and backend are completely decoupled, each can be deployed to the platform best suited for it without conflicts:

### Backend Deployment (Laravel Cloud / Forge / Render / Docker)
- **Application / Root Directory**: `backend`
- **Build Command**: `composer install --no-dev --optimize-autoloader`
- **Post-Deploy Command**: `php artisan migrate --force && php artisan config:cache && php artisan route:cache`
- **Required Environment Variables**:
  - `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY`, `APP_URL=https://<your-backend-domain>`
  - `DB_HOST`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
  - `REDIS_HOST`, `REDIS_PASSWORD`
  - `STRIPE_KEY`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`
  - `CORS_ALLOWED_ORIGINS=https://<your-frontend-domain>`
  - `SANCTUM_STATEFUL_DOMAINS=<your-frontend-domain>`

### Frontend Deployment (Vercel / Netlify / Cloudflare Pages)
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Required Environment Variables**:
  - `VITE_API_URL=https://<your-backend-domain>/api`
  - `VITE_STRIPE_KEY=pk_live_...` (or test key for staging)

3. **Start All Services Concurrently**:
   ```bash
   # From root: starts Laravel server, queue worker, logs, and Vite
   composer run dev
   ```

---

## 🔑 Demo Credentials

Running `php artisan migrate --seed` populates sample products and default user accounts:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@shopvault.com` | `password` | Full Admin Panel & Storefront |
| **Customer** | *(Register via `/register`)* | *(Your password)* | Customer Dashboard & Orders |

---

## 🧪 Testing & Code Quality

The backend test suite uses in-memory SQLite and mocks Stripe gateway interactions to verify end-to-end flows deterministically.

```bash
# Run the full PHPUnit test suite (49 tests, 100% pass)
php artisan test

# Run PHP code style checks (Laravel Pint)
./vendor/bin/pint --test

# Build frontend for production
cd frontend && npm run build
```

---

## 📚 In-Depth Documentation

- **[BACKEND_DEEP_DIVE.md](file:///home/kaminari0x/ecommerce/BACKEND_DEEP_DIVE.md)**: A complete 3,000+ line guide breaking down every single backend class, design pattern, and lifecycle execution step.
- **[systemdesign](file:///home/kaminari0x/ecommerce/systemdesign)**: Architectural blueprints, entity relationships, and distributed system design considerations.
- **[CLAUDE.md](file:///home/kaminari0x/ecommerce/CLAUDE.md)**: Development workflow cheat sheet and common command references.

---

## 📄 License

This project is open-source software licensed under the [MIT License](LICENSE).
