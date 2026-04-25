# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

This is a Laravel 13 + React ecommerce application with a layered architecture:

- **Backend**: Laravel 13 (PHP 8.3) with API-first design, Sanctum authentication, Stripe payments
- **Frontend**: React 19 + Vite with Tailwind CSS 4
- **Database**: MySQL 8.0 (via Docker)
- **Cache/Queue**: Redis (via Docker)
- **Server**: Nginx + PHP-FPM (via Docker)

## Architecture

### Backend (Laravel)

The backend is organized around clean API patterns:

- **Controllers** (`app/Http/Controllers/`): Organized by domain (Auth, Api, Cart). Single-action controllers are the pattern.
- **Models** (`app/Models/`): Eloquent ORM with relationships and business logic
- **Services** (`app/Services/`): Business logic extraction; payment/order processing lives here
- **Actions** (`app/Actions/`): Queued/event-driven operations
- **Middleware**: Authentication via Sanctum, rate limiting (throttle), idempotency checks on checkout
- **Routes** (`routes/api.php`): API routes under `/api/v1` and `/api/auth` prefixes; cart endpoints are separate

Key patterns:
- Auth endpoints: registration, login, logout, password reset (with throttling)
- Product catalog: read-only, public endpoints
- Checkout flow: `buy-now` (direct purchase) and `checkout` (cart-based); both use idempotency middleware
- Cart: protected endpoints for item management (add, update, delete, clear)
- Payments: webhook endpoint for Stripe processing

### Frontend (React)

Structure mirrors standard React patterns:
- **Pages** (`src/pages/`): Route-level components
- **Components** (`src/components/`): Reusable UI components
- **Hooks** (`src/hooks/`): Custom React hooks
- **Store** (`src/store/`): State management (check for Context, Redux, or Zustand usage)
- **API** (`src/api/`): Axios-based client to backend
- **Utils** (`src/utils/`): Helpers and utilities

The app uses Laravel Vite plugin for HMR during development. Vite config includes Tailwind CSS 4.

## Development Workflow

### Local Setup

```bash
composer install
npm install
php artisan key:generate
php artisan migrate
npm run dev
```

### Running Locally (Combined Frontend + Backend)

```bash
composer run dev
```

This starts all services concurrently:
- Laravel dev server (port 8000)
- Queue listener
- Laravel Pail logs
- Vite dev server

To kill all services: `Ctrl+C`

### Docker

The project includes Docker Compose for isolated environment:

```bash
docker-compose up
```

Services:
- **app**: PHP-FPM container, depends on MySQL and Redis
- **nginx**: Web server (port 8000)
- **mysql**: Database (port 3306)
- **redis**: Cache/queue backend (port 6379)
- **queue**: Separate container for queue workers
- **scheduler**: Runs Laravel scheduler every 60 seconds

Volumes are mounted for live code changes. Environment variables from `.env` are injected.

### Testing

Run all tests:
```bash
composer test
```

This clears config cache first, then runs PHPUnit. Tests are split into:
- Unit tests: `tests/Unit/`
- Feature tests: `tests/Feature/`

Test database is in-memory SQLite (see `phpunit.xml`).

### Linting & Code Quality

- **PHP linting**: `php artisan pint` (Laravel's opinionated fixer)
- **Static analysis**: `larastan` (Laravel static analyzer, included in require-dev)

### Frontend Build

```bash
npm run build
```

Outputs to `frontend/dist/`. Vite is configured with Laravel plugin for asset versioning.

## Key Files & Patterns

- `.env.example`: Template for environment variables; copy to `.env` and configure
- `composer.json`: Scripts for setup, dev, test; Laravel bootstrap hooks
- `routes/api.php`: All API endpoints; grouped by prefix (auth, v1, cart)
- `phpunit.xml`: Test configuration with in-memory DB and testing environment overrides
- `docker-compose.yml`: Full local development stack with health checks
- `frontend/vite.config.js`: Vite config with Laravel plugin and Tailwind CSS 4

## Common Commands

| Task | Command |
|------|---------|
| Full setup | `composer run setup` |
| Local dev (combined) | `composer run dev` |
| Run tests | `composer test` |
| Lint PHP | `php artisan pint` |
| Start Docker services | `docker-compose up` |
| Laravel artisan | `php artisan <command>` |
| Frontend build | `npm run build` |
| Frontend dev | `npm run dev` |

## Notes for AI Agents

- **Authentication**: Sanctum tokens stored in Authorization header (Bearer token)
- **Rate limiting**: Some endpoints use throttle middleware; check routes for limits
- **Idempotency**: Checkout endpoints require an idempotency key to prevent duplicate orders
- **Queue jobs**: Triggered by actions; ensure queue listener is running during dev (`composer run dev` handles this)
- **Stripe**: Payment processing via webhook; webhook endpoint is public (unauthenticated)
- **Frontend environment**: Add API base URL to `.env` in `frontend/` if not served from same origin