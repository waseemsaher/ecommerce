# Backend Deep Dive - Complete Line-by-Line Explanation

> This document covers **every single backend file** in this Laravel 13 e-commerce project.
> It explains what each file does, why it exists, and every concept used inside it.
> Use this as your study guide to understand and complete the project on your own.

---

## Table of Contents

1. [Project Overview & Architecture](#1-project-overview--architecture)
2. [Entry Point - How a Request Reaches Laravel](#2-entry-point---how-a-request-reaches-laravel)
3. [Configuration Files](#3-configuration-files)
4. [Bootstrap - Application Wiring](#4-bootstrap---application-wiring)
5. [Service Providers - The Heart of Laravel](#5-service-providers---the-heart-of-laravel)
6. [Routes - API Endpoints](#6-routes---api-endpoints)
7. [Middleware](#7-middleware)
8. [Form Requests - Validation Layer](#8-form-requests---validation-layer)
9. [Controllers](#9-controllers)
10. [Models & Eloquent ORM](#10-models--eloquent-orm)
11. [Enums - Type-Safe Status Values](#11-enums---type-safe-status-values)
12. [Actions - Business Logic Layer](#12-actions---business-logic-layer)
13. [Services](#13-services)
14. [Contracts (Interfaces)](#14-contracts-interfaces)
15. [Events & Listeners](#15-events--listeners)
16. [Custom Exceptions](#16-custom-exceptions)
17. [Database: Migrations](#17-database-migrations)
18. [Database: Seeders & Factories](#18-database-seeders--factories)
19. [Docker Infrastructure](#19-docker-infrastructure)
20. [Testing](#20-testing)
21. [Data Flow Walkthroughs](#21-data-flow-walkthroughs)
22. [What You Could Build Next](#22-what-you-could-build-next)

---

## 1. Project Overview & Architecture

### What is this project?

A complete **REST API** for an e-commerce store. Users can:
- Register, login, logout, reset passwords
- Browse a product catalog (with filtering, sorting, pagination)
- Manage a shopping cart (add, update, remove, clear)
- Checkout (from cart or "buy now" directly)
- Pay via Stripe (payment intents with webhooks)
- View their order history

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | PHP | 8.3 |
| Framework | Laravel | 13 |
| Auth | Laravel Sanctum | 4.0 |
| Payments | Stripe PHP SDK | 20.0 |
| Database | MySQL | 8.0 |
| Cache/Queue | Redis | 7 |
| Web Server | Nginx | 1.25 |
| Container | Docker Compose | - |
| Testing | PHPUnit | 12 |

### Architecture Pattern

The project uses a **layered architecture**:

```
Request
  -> Route
    -> Middleware (auth, rate-limit, idempotency)
      -> Form Request (validation)
        -> Controller (thin - orchestrates only)
          -> Action (business logic)
            -> Model (database interaction)
          -> Service (caching, payments)
          -> Event -> Listener (async side effects)
  <- JSON Response
```

**Why layers?** Each layer has a single responsibility:
- **Controllers** don't contain business logic - they call Actions
- **Actions** don't know about HTTP - they just receive data and return results
- **Services** handle cross-cutting concerns (caching, payment gateways)
- **Models** handle database queries only

---

## 2. Entry Point - How a Request Reaches Laravel

### `public/index.php`

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));
```

- `define('LARAVEL_START', microtime(true))` - Records the exact time the request started. `microtime(true)` returns a float like `1714000000.123456`. This is used later to calculate how long the request took (you see this in debugbar/logs).

```php
if (file_exists($maintenance = __DIR__.'/../storage/framework/maintenance.php')) {
    require $maintenance;
}
```

- **Maintenance mode check.** When you run `php artisan down`, Laravel creates a file at `storage/framework/maintenance.php`. If that file exists, it gets loaded and returns a 503 "Service Unavailable" page before any framework code runs. This is how you take your app offline for deployments.

```php
require __DIR__.'/../vendor/autoload.php';
```

- **Composer autoloader.** This single line loads ALL of your PHP classes. Composer generates a map of `class name -> file path`. Without this, PHP wouldn't know where to find `App\Models\User` or `Illuminate\Http\Request`. PSR-4 autoloading means `App\Models\User` maps to `app/Models/User.php`.

```php
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->handleRequest(Request::capture());
```

- `require_once` loads `bootstrap/app.php` which builds and configures the entire application instance.
- `Request::capture()` creates a Request object from PHP's global variables (`$_GET`, `$_POST`, `$_SERVER`, `$_COOKIE`, etc.).
- `handleRequest()` runs the full middleware pipeline, routes the request, calls the controller, and sends back the response.

**Concept: Front Controller Pattern** - Every single HTTP request (whether it's `/api/auth/login` or `/api/v1/products`) goes through this ONE file. The web server (Nginx) is configured to send everything to `public/index.php`. The framework then figures out which controller to call based on the URL.

---

## 3. Configuration Files

### `composer.json` - PHP Dependency Manager

```json
{
    "$schema": "https://getcomposer.org/schema.json",
    "name": "laravel/laravel",
    "type": "project",
```

- `$schema` - Tells IDEs what the file format looks like, so they can offer autocomplete.
- `name` - The package name in `vendor/package` format.
- `type: "project"` - This is a standalone project, not a reusable library.

#### Production Dependencies (`require`)

```json
"require": {
    "php": "^8.3",
    "laravel/framework": "^13.0",
    "laravel/sanctum": "^4.0",
    "laravel/tinker": "^3.0",
    "stripe/stripe-php": "^20.0"
}
```

| Package | What It Does |
|---------|-------------|
| `php: ^8.3` | Requires PHP 8.3 or higher. `^` means compatible (8.3, 8.4, etc., but NOT 9.0) |
| `laravel/framework` | The actual Laravel framework - routing, ORM, queue, cache, everything |
| `laravel/sanctum` | API token authentication. Creates tokens users send in `Authorization: Bearer <token>` headers |
| `laravel/tinker` | Interactive REPL (Read-Eval-Print Loop). Run `php artisan tinker` to execute PHP interactively |
| `stripe/stripe-php` | Official Stripe PHP SDK for payment processing |

#### Dev Dependencies (`require-dev`)

```json
"require-dev": {
    "barryvdh/laravel-debugbar": "^4.2",
    "fakerphp/faker": "^1.23",
    "larastan/larastan": "^3.9",
    "laravel/pail": "^1.2.5",
    "laravel/pint": "^1.27",
    "mockery/mockery": "^1.6",
    "nunomaduro/collision": "^8.6",
    "phpunit/phpunit": "^12.5.12"
}
```

| Package | What It Does |
|---------|-------------|
| `laravel-debugbar` | Shows a toolbar in browser with queries, request info, memory usage |
| `faker` | Generates fake data for testing (names, emails, addresses, etc.) |
| `larastan` | Static analysis - finds bugs without running the code (like TypeScript for PHP) |
| `laravel/pail` | Real-time log viewer in the terminal |
| `laravel/pint` | Code style fixer (auto-formats your PHP code) |
| `mockery` | Creates mock objects in tests (fake classes that simulate real ones) |
| `collision` | Pretty error reporting in the terminal when tests fail |
| `phpunit` | The actual test runner |

These are only installed in development (`composer install --dev`), not in production.

#### Autoloading

```json
"autoload": {
    "psr-4": {
        "App\\": "app/",
        "Database\\Factories\\": "database/factories/",
        "Database\\Seeders\\": "database/seeders/"
    }
}
```

**PSR-4 autoloading** maps namespace prefixes to directories:
- `App\Models\User` -> `app/Models/User.php`
- `App\Http\Controllers\CartController` -> `app/Http/Controllers/CartController.php`
- `Database\Factories\UserFactory` -> `database/factories/UserFactory.php`

The `autoload-dev` section maps `Tests\` to `tests/` but only in development.

#### Scripts

```json
"scripts": {
    "setup": [
        "composer install",
        "@php -r \"file_exists('.env') || copy('.env.example', '.env');\"",
        "@php artisan key:generate",
        "@php artisan migrate --force",
        "npm install --ignore-scripts",
        "npm run build"
    ],
```

- `composer run setup` runs all these commands in order.
- `@php` means "use the same PHP binary that's running Composer."
- The second line copies `.env.example` to `.env` if `.env` doesn't already exist.
- `key:generate` creates the `APP_KEY` used for encryption (cookies, sessions, passwords).
- `migrate --force` runs all database migrations (the `--force` flag is needed in production).

```json
    "dev": [
        "Composer\\Config::disableProcessTimeout",
        "npx concurrently -c \"#93c5fd,#c4b5fd,#fb7185,#fdba74\"
            \"php artisan serve\"
            \"php artisan queue:listen --tries=1 --timeout=0\"
            \"php artisan pail --timeout=0\"
            \"npm run dev\"
            --names=server,queue,logs,vite --kill-others"
    ],
```

- `disableProcessTimeout` - Composer normally kills commands after 300 seconds. This disables that because dev servers run forever.
- `npx concurrently` runs 4 processes simultaneously:
  1. `php artisan serve` - Laravel dev server on port 8000
  2. `php artisan queue:listen` - Processes background jobs (like sending emails)
  3. `php artisan pail` - Real-time log viewer
  4. `npm run dev` - Vite dev server for frontend hot-reloading
- `--kill-others` means if you Ctrl+C one, all 4 stop.

```json
    "test": [
        "@php artisan config:clear --ansi",
        "@php artisan test"
    ],
```

- `config:clear` removes cached config so tests use fresh configuration.
- `artisan test` runs PHPUnit with Laravel's test runner (nicer output than raw PHPUnit).

### `.env.example` - Environment Variables Template

```
APP_NAME="Laravel E-Commerce"
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000
```

- `APP_ENV` - `local`, `staging`, or `production`. Controls error display, logging levels, etc.
- `APP_KEY` - 32-character encryption key. Generated by `php artisan key:generate`. Used by Laravel to encrypt cookies, sessions, and anything you pass through `encrypt()`.
- `APP_DEBUG=true` - Shows detailed error pages with stack traces. **MUST be false in production** (leaks code/secrets).

```
CORS_ALLOWED_ORIGINS=https://waseem.ninja,https://www.waseem.ninja,http://localhost:5173,http://127.0.0.1:5173
SANCTUM_STATEFUL_DOMAINS=waseem.ninja,www.waseem.ninja,localhost,localhost:5173,127.0.0.1,127.0.0.1:5173
```

- **CORS** (Cross-Origin Resource Sharing) - Browsers block requests from `frontend.com` to `api.com` by default. CORS headers tell the browser "these origins are allowed." The frontend at `localhost:5173` (Vite dev server) needs permission to call the API at `localhost:8000`.
- **Sanctum Stateful Domains** - For cookie-based auth (SPAs). Requests from these domains can use session cookies instead of Bearer tokens.

```
DB_CONNECTION=mysql
DB_HOST=mysql          # 'mysql' is the Docker service name
DB_PORT=3306
DB_DATABASE=ecommerce
DB_USERNAME=ecommerce
DB_PASSWORD=secret
DB_ROOT_PASSWORD=rootsecret
```

- `DB_HOST=mysql` - Inside Docker, services communicate by service name. The MySQL container is named `mysql`, so the app container connects to `mysql:3306`.

```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redissecret

CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
```

- Redis is used for three things:
  1. **Cache** - Storing computed data (like cart contents) to avoid hitting the database
  2. **Queue** - Storing background jobs (like "send order confirmation email")
  3. **Session** - Storing user session data

```
STRIPE_KEY=pk_test_...
STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

- `STRIPE_KEY` - Public key, safe to expose to the frontend (used by Stripe.js)
- `STRIPE_SECRET` - Secret key, server-side only. Used to create payment intents.
- `STRIPE_WEBHOOK_SECRET` - Used to verify that webhook requests actually come from Stripe (not an attacker).

### `phpunit.xml` - Test Configuration

```xml
<phpunit bootstrap="vendor/autoload.php" colors="true">
```

- `bootstrap` - Loads Composer's autoloader before any tests run.
- `colors="true"` - Green for passing, red for failing.

```xml
<testsuites>
    <testsuite name="Unit">
        <directory>tests/Unit</directory>
    </testsuite>
    <testsuite name="Feature">
        <directory>tests/Feature</directory>
    </testsuite>
</testsuites>
```

Two test suites:
- **Unit tests** (`tests/Unit/`) - Test individual classes in isolation (no database, no HTTP)
- **Feature tests** (`tests/Feature/`) - Test full HTTP requests end-to-end (with database, middleware, etc.)

```xml
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="BCRYPT_ROUNDS" value="4"/>
    <env name="CACHE_STORE" value="array"/>
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE" value=":memory:"/>
    <env name="MAIL_MAILER" value="array"/>
    <env name="QUEUE_CONNECTION" value="sync"/>
    <env name="SESSION_DRIVER" value="array"/>
</php>
```

These override `.env` during testing:
- `DB_CONNECTION=sqlite` + `DB_DATABASE=:memory:` - Uses an in-memory SQLite database. It's created fresh for each test and destroyed when the test ends. This is **much faster** than MySQL and doesn't need a real database server.
- `BCRYPT_ROUNDS=4` - Normally 12 rounds. Lowered to 4 for speed (password hashing is intentionally slow; 4 rounds is fine for tests).
- `CACHE_STORE=array` - Cache lives in PHP memory (no Redis needed).
- `QUEUE_CONNECTION=sync` - Jobs run immediately instead of being queued (no Redis needed).
- `MAIL_MAILER=array` - Emails are captured in memory instead of actually sent.

---

## 4. Bootstrap - Application Wiring

### `bootstrap/app.php`

This is where the Laravel application is assembled.

```php
use App\Http\Middleware\EnsureIdempotencyKey;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
```

- `Application::configure()` is Laravel 13's fluent configuration API.
- `basePath: dirname(__DIR__)` - Sets the project root. `__DIR__` is the `bootstrap/` directory, so `dirname(__DIR__)` goes up one level to the project root. Laravel uses this to resolve paths like `app/`, `config/`, `storage/`, etc.

```php
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
```

- Registers three route files:
  - `web.php` - Browser routes (with CSRF protection, sessions)
  - `api.php` - API routes (all routes get `/api` prefix automatically)
  - `console.php` - Artisan CLI commands
- `health: '/up'` - Creates a `GET /up` endpoint that returns 200. Used by load balancers/Docker to check if the app is alive.

```php
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'idempotency' => EnsureIdempotencyKey::class,
        ]);
    })
```

- **Middleware aliases** let you reference middleware by short names in routes. Instead of writing `\App\Http\Middleware\EnsureIdempotencyKey::class` in every route, you write `'idempotency'`.

```php
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
```

- Custom exception handling. Currently empty (using defaults). You could add custom rendering for specific exceptions here.

### `bootstrap/providers.php`

```php
use App\Providers\AppServiceProvider;
use App\Providers\EventServiceProvider;
use App\Providers\RateLimitServiceProvider;

return [
    AppServiceProvider::class,
    EventServiceProvider::class,
    RateLimitServiceProvider::class,
];
```

This tells Laravel which **Service Providers** to load. Providers are the central place to configure and register services. Laravel loads these in order during boot.

---

## 5. Service Providers - The Heart of Laravel

### `app/Providers/AppServiceProvider.php`

```php
namespace App\Providers;

use App\Contracts\PaymentGatewayInterface;
use App\Services\Payments\StripeGateway;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        //
    }

    public function register(): void
    {
        $this->app->bind(PaymentGatewayInterface::class, StripeGateway::class);
    }
}
```

**Concept: Service Container & Dependency Injection**

- `$this->app->bind(PaymentGatewayInterface::class, StripeGateway::class)` tells Laravel: "Whenever someone asks for a `PaymentGatewayInterface`, give them a `StripeGateway` instance."
- This is **Dependency Injection** (DI). Controllers and Actions don't create their own dependencies - they declare what they need, and Laravel provides it.
- **Why interfaces?** If you switch from Stripe to PayPal later, you only change this ONE line. Every controller/action that depends on `PaymentGatewayInterface` automatically gets the new implementation.

The two methods:
- `register()` - Bind things into the container. Don't use other services here (they might not be registered yet).
- `boot()` - Called after ALL providers are registered. Safe to use any service.

### `app/Providers/EventServiceProvider.php`

```php
namespace App\Providers;

use App\Events\OrderPlaced;
use App\Listeners\SendOrderConfirmationListener;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    protected $listen = [
        OrderPlaced::class => [
            SendOrderConfirmationListener::class,
        ],
    ];
}
```

**Concept: Event-Driven Architecture**

- The `$listen` array maps **events** to **listeners**.
- When `OrderPlaced` event is fired (via `event(new OrderPlaced($order))`), Laravel automatically calls `SendOrderConfirmationListener::handle()`.
- **Why events?** Decoupling. The checkout code doesn't know or care about sending emails. It just says "an order was placed." Other parts of the system react independently.
- You can add multiple listeners per event. For example, you could add a `UpdateInventoryAnalyticsListener`, `NotifyWarehouseListener`, etc. without touching the checkout code.

### `app/Providers/RateLimitServiceProvider.php`

```php
namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class RateLimitServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->configureRateLimiters();
    }

    private function configureRateLimiters(): void
    {
        RateLimiter::for('register', function (Request $request) {
            return Limit::perMinute(3)->by($request->ip());
        });

        RateLimiter::for('login', function (Request $request) {
            return Limit::perMinute(5)->by($request->ip());
        });

        RateLimiter::for('cart', function (Request $request) {
            return Limit::perMinute(30)
                ->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('checkout', function (Request $request) {
            return Limit::perMinute(10)
                ->by($request->user()?->id ?: $request->ip());
        });
    }
}
```

**Concept: Rate Limiting**

- `RateLimiter::for('name', callback)` defines a named rate limiter.
- These are used in routes via `->middleware('throttle:register')`.
- `Limit::perMinute(3)->by($request->ip())` means "max 3 requests per minute, tracked per IP address."
- `->by($request->user()?->id ?: $request->ip())` - Track by user ID if authenticated, otherwise by IP.
- **Why?** Prevents brute-force attacks (login), abuse (cart spam), and accidental duplicate orders (checkout).
- When the limit is exceeded, Laravel returns `429 Too Many Requests`.

The `?->` is PHP's **nullsafe operator**. If `$request->user()` is `null`, it returns `null` instead of crashing. The `?:` is the **Elvis operator** - if the left side is falsy, use the right side.

---

## 6. Routes - API Endpoints

### `routes/api.php`

All routes in this file are automatically prefixed with `/api` by Laravel.

#### Auth Routes

```php
Route::prefix('auth')->group(function () {

    Route::post('/register', RegisterController::class)
        ->middleware('throttle:register');

    Route::post('/login', LoginController::class)
        ->middleware('throttle:login');

    Route::post('/logout', LogoutController::class)
        ->middleware('auth:sanctum');

    Route::post('/password/forgot', ForgotPasswordController::class)
        ->middleware('throttle:login');

    Route::post('/password/reset', ResetPasswordController::class)
        ->middleware('throttle:login');
});
```

- `Route::prefix('auth')` - All routes inside get `/auth` prefix. So `POST /register` becomes `POST /api/auth/register`.
- `->group(function () { ... })` - Groups routes that share configuration.
- `RegisterController::class` (without a method name) means Laravel calls the `__invoke()` method. This is the **Single-Action Controller** pattern - one controller, one job.
- `'throttle:register'` - Applies the `register` rate limiter (3/minute).
- `'auth:sanctum'` - Requires a valid Sanctum token. The request must include `Authorization: Bearer <token>` header. If not, Laravel returns 401.

#### Product & Order Routes

```php
Route::prefix('v1')->group(function () {

    // Public - no auth required
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    // Protected - auth + rate limit
    Route::middleware(['auth:sanctum', 'throttle:checkout'])
        ->group(function () {
            Route::post('/buy-now', [OrderController::class, 'buyNow'])
                ->middleware('idempotency');
            Route::post('/checkout', [OrderController::class, 'checkout'])
                ->middleware('idempotency');
            Route::get('/orders', [OrderController::class, 'index']);
            Route::get('/orders/{id}', [OrderController::class, 'show']);
        });

    Route::post('/payments/webhook', [PaymentController::class, 'webhook']);
});
```

- `{slug}` and `{id}` are **route parameters**. In `/products/wireless-headphones`, the value `wireless-headphones` is passed to the controller as the `$slug` parameter.
- `[ProductController::class, 'index']` - Calls the `index` method on `ProductController`.
- The checkout routes use **three middleware stacked**: `auth:sanctum` (must be logged in) + `throttle:checkout` (10/min) + `idempotency` (prevent duplicate orders).
- The webhook route is **public** (no auth) because Stripe sends webhook requests from their servers, not from your logged-in users. Authentication is handled by verifying the Stripe signature.

#### Cart Routes

```php
Route::middleware(['auth:sanctum', 'throttle:cart'])
    ->prefix('cart')
    ->group(function () {
        Route::get('/',                     [CartController::class, 'index']);
        Route::post('/items',               [CartController::class, 'store']);
        Route::put('/items/{productId}',    [CartController::class, 'update']);
        Route::delete('/items/{productId}', [CartController::class, 'destroy']);
        Route::delete('/',                  [CartController::class, 'clear']);
    });
```

This follows **RESTful conventions**:

| Method | URL | Action | Purpose |
|--------|-----|--------|---------|
| GET | /api/cart | index | View cart contents |
| POST | /api/cart/items | store | Add item to cart |
| PUT | /api/cart/items/{id} | update | Update quantity |
| DELETE | /api/cart/items/{id} | destroy | Remove one item |
| DELETE | /api/cart | clear | Empty the whole cart |

### `routes/web.php`

```php
Route::get('/', function () {
    return view('welcome');
});

Route::get('/health', function () {
    $services = ['database' => 'ok', 'redis' => 'ok', 'queue' => 'ok'];

    try {
        DB::select('select 1');
    } catch (\Throwable) {
        $services['database'] = 'failed';
    }
    // ... similar for redis and queue ...

    $status = in_array('failed', $services, true) ? 'degraded' : 'ok';
    return response()->json([...], $status === 'ok' ? 200 : 503);
});
```

- `/` - Returns the Laravel welcome page (Blade template).
- `/health` - A **health check endpoint**. It tests all critical services (database, redis, queue). If any fail, it returns 503. Used by Docker healthchecks, load balancers, and monitoring systems.
- `DB::select('select 1')` - Simplest possible query to check if the database is reachable.
- `Cache::store('redis')->put(...)` then `->forget(...)` - Writes and deletes a test key to verify Redis works.
- `Queue::connection()->size()` - Checks if the queue system is accessible.

### `routes/console.php`

```php
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
```

- Registers a custom Artisan command: `php artisan inspire`.
- `$this->comment()` outputs colored text to the terminal.
- This is just a demo command that ships with Laravel.

---

## 7. Middleware

### `app/Http/Middleware/EnsureIdempotencyKey.php`

**Concept: Idempotency** - Making the same request multiple times produces the same result. If a user clicks "Pay" twice (or the network retries), only ONE order is created.

```php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class EnsureIdempotencyKey
{
    public function handle(Request $request, Closure $next): JsonResponse|Response
    {
```

- `$next` is the next step in the middleware pipeline (eventually reaches the controller).
- Return type `JsonResponse|Response` is a PHP **union type** - can return either type.

```php
        $idempotencyKey = $request->header('Idempotency-Key');

        if (! $idempotencyKey) {
            return response()->json([
                'message' => 'Idempotency-Key header is required.',
                'error'   => 'IDEMPOTENCY_KEY_REQUIRED',
            ], 422);
        }
```

- The client MUST send an `Idempotency-Key` header (a unique string like a UUID).
- If missing, return 422 immediately without processing the request.

```php
        $cacheKey = $this->cacheKey($request, $idempotencyKey);

        if (Cache::has($cacheKey)) {
            $cachedResponse = Cache::get($cacheKey);
            return response()->json(
                $cachedResponse['data'],
                $cachedResponse['status']
            );
        }
```

- Build a unique cache key from the user ID + hashed idempotency key.
- If we've seen this key before, return the **exact same response** as the first time. The order isn't created again.

```php
        $response = $next($request);

        if ($response instanceof JsonResponse && $response->isSuccessful()) {
            Cache::put($cacheKey, [
                'status' => $response->status(),
                'data'   => $response->getData(true),
            ], now()->addDay());
        }

        return $response;
    }
```

- `$next($request)` passes the request to the controller (first time only).
- If the response is successful (2xx), cache it for 24 hours.
- If the response is an error, DON'T cache it (the user should be able to retry).

```php
    private function cacheKey(Request $request, string $idempotencyKey): string
    {
        return sprintf(
            'idempotency:checkout:%s:%s',
            $request->user()?->id ?? $request->ip(),
            hash('sha256', $idempotencyKey)
        );
    }
}
```

- The cache key combines the user ID and a SHA-256 hash of the idempotency key.
- `??` is the **null coalescing operator** - if `$request->user()?->id` is null, use `$request->ip()`.
- Hashing the key prevents injection attacks and normalizes the key length.

---

## 8. Form Requests - Validation Layer

Form Requests are classes that validate incoming data BEFORE it reaches the controller. If validation fails, Laravel automatically returns a 422 response with error details.

### `app/Http/Requests/Auth/RegisterRequest.php`

```php
class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Anyone can attempt to register
    }

    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
```

- `authorize()` - Should this user be allowed to make this request? `true` = yes, anyone.
- `rules()` returns validation rules per field:
  - `'required'` - Field must be present and not empty
  - `'string'` - Must be a string
  - `'max:255'` - Max 255 characters
  - `'email'` - Must be a valid email format
  - `'unique:users,email'` - Must not exist in the `users` table's `email` column
  - `'min:8'` - At least 8 characters
  - `'confirmed'` - A matching `password_confirmation` field must be present

```php
    public function messages(): array
    {
        return [
            'email.unique'       => 'An account with this email already exists.',
            'password.confirmed' => 'Password confirmation does not match.',
        ];
    }
```

- Custom error messages. The format is `field.rule`. Without this, Laravel uses generic messages.

### `app/Http/Requests/Auth/LoginRequest.php`

```php
class LoginRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ];
    }
}
```

- Simpler than register - just needs email and password, no uniqueness check.

### `app/Http/Requests/Auth/ForgotPasswordRequest.php`

```php
public function rules(): array
{
    return [
        'email' => ['required', 'email'],
    ];
}
```

- Only needs an email address.

### `app/Http/Requests/Auth/ResetPasswordRequest.php`

```php
public function rules(): array
{
    return [
        'token'    => ['required', 'string'],
        'email'    => ['required', 'email'],
        'password' => ['required', 'string', 'min:8', 'confirmed'],
    ];
}
```

- Needs the reset token (from the email link), email, new password, and confirmation.

### `app/Http/Requests/ProductFilterRequest.php`

```php
class ProductFilterRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'is_active' => ['nullable', 'sometimes', 'boolean'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'gte:min_price'],
            'sort'      => ['nullable', Rule::in(['price_asc', 'price_desc', 'name_asc', 'created_desc'])],
        ];
    }
```

- `'nullable'` - The field can be absent or null (all filters are optional).
- `'sometimes'` - Only validate if present.
- `'gte:min_price'` - `max_price` must be greater than or equal to `min_price`.
- `Rule::in([...])` - A **whitelist**. Only these exact values are allowed. This is a security pattern - prevents SQL injection through sort parameters.

```php
    protected function prepareForValidation(): void
    {
        if ($this->has('is_active')) {
            $this->merge([
                'is_active' => filter_var($this->is_active, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }
    }
}
```

- `prepareForValidation()` runs BEFORE validation. It transforms the input.
- Query strings are always strings. `?is_active=true` sends the string `"true"`, not the boolean `true`. `filter_var` converts `"true"/"1"/"on"` to `true`, and `"false"/"0"/"off"` to `false`.

### `app/Http/Requests/AddToCartRequest.php`

```php
public function rules(): array
{
    return [
        'product_id' => ['required', 'integer', 'exists:products,id'],
        'quantity'   => ['sometimes', 'integer', 'min:1', 'max:100'],
    ];
}
```

- `'exists:products,id'` - The product_id must exist in the `products` table's `id` column. This prevents adding nonexistent products.
- `'max:100'` - Can't add more than 100 of one item (sanity check).

### `app/Http/Requests/UpdateCartItemRequest.php`

```php
public function rules(): array
{
    return [
        'quantity' => ['required', 'integer', 'min:1', 'max:100'],
    ];
}
```

### `app/Http/Requests/BuyNowRequest.php`

```php
public function rules(): array
{
    return [
        'product_id' => ['required', 'integer', 'exists:products,id'],
        'quantity'   => ['sometimes', 'integer', 'min:1', 'max:100'],
    ];
}
```

Same as AddToCart - needs a valid product ID and optional quantity.

---

## 9. Controllers

Controllers are **thin** in this project. They receive validated input, delegate to Actions/Services, and return JSON responses.

### `app/Http/Controllers/Controller.php`

```php
abstract class Controller
{
    //
}
```

- Base controller. `abstract` means you can't instantiate it directly - only extend it. Currently empty (Laravel 13 removed the default traits), but exists as a place to add shared methods.

### Auth Controllers

#### `RegisterController.php` (Single-Action)

```php
class RegisterController extends Controller
{
    public function __invoke(RegisterRequest $request): JsonResponse
    {
```

- `__invoke()` is PHP's magic method for making an object callable. When a route points to `RegisterController::class` (without a method), PHP calls `__invoke()`.
- `RegisterRequest $request` - Laravel automatically validates the request using `RegisterRequest`'s rules BEFORE this method runs. If validation fails, it never reaches here.

```php
        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
        ]);
```

- `User::create([...])` creates a new user in the database (INSERT query).
- `Hash::make()` hashes the password using bcrypt. The plain-text password is NEVER stored.

```php
        $token = $user->createToken('api-token')->plainTextToken;
```

- `createToken('api-token')` creates a new Sanctum personal access token.
- `->plainTextToken` returns the un-hashed token string (like `1|abc123xyz`). This is shown to the user once and never retrievable again. Laravel stores only the hash in the database.
- `'api-token'` is just a label/name for the token.

```php
        return response()->json([
            'token' => $token,
            'user'  => $user,
        ], 201);
```

- Returns the token and user data. Status 201 = "Created."

#### `LoginController.php`

```php
public function __invoke(LoginRequest $request): JsonResponse
{
    $user = User::where('email', $request->email)->first();

    if (! $user || ! Hash::check($request->password, $user->password)) {
        throw ValidationException::withMessages([
            'email' => ['The provided credentials are incorrect.'],
        ]);
    }
```

- Finds user by email. `first()` returns the first match or `null`.
- `Hash::check(plain, hashed)` verifies the password without exposing the hash. Returns `true`/`false`.
- **Security note**: The error message says "credentials are incorrect" for BOTH wrong email and wrong password. This prevents **user enumeration** - an attacker can't tell if the email exists.
- `throw ValidationException::withMessages(...)` returns a 422 response with validation-style errors.

```php
    // Revoke old tokens (optional -- enforce single-session)
    // $user->tokens()->delete();

    $token = $user->createToken('api-token')->plainTextToken;

    return response()->json([
        'token' => $token,
        'user'  => $user,
    ], 200);
}
```

- The commented-out line would delete all previous tokens, forcing single-session login.

#### `LogoutController.php`

```php
public function __invoke(Request $request): JsonResponse
{
    $request->user()->currentAccessToken()->delete();
    return response()->json(['message' => 'Logged out successfully.']);
}
```

- `$request->user()` returns the authenticated user (Sanctum resolved this from the Bearer token).
- `currentAccessToken()` gets the specific token used for THIS request.
- `->delete()` removes it from the database, invalidating it.
- Only the current token is revoked - other sessions stay active.

#### `ForgotPasswordController.php`

```php
public function __invoke(ForgotPasswordRequest $request): JsonResponse
{
    $status = Password::sendResetLink(
        $request->only('email')
    );

    // Always return 200 regardless of whether the email exists.
    return response()->json([
        'message' => 'If an account with that email exists, a password reset link has been sent.',
    ], 200);
}
```

- `Password::sendResetLink()` is Laravel's built-in password reset. It generates a token, stores it in the `password_reset_tokens` table, and sends an email with a reset link.
- **Always returns 200** - This prevents user enumeration. An attacker can't tell if `attacker@test.com` has an account by checking if the response is 200 or 404.

#### `ResetPasswordController.php`

```php
public function __invoke(ResetPasswordRequest $request): JsonResponse
{
    $status = Password::reset(
        $request->only('email', 'password', 'password_confirmation', 'token'),
        function ($user, string $password) {
            $user->forceFill([
                'password'       => Hash::make($password),
                'remember_token' => Str::random(60),
            ])->save();

            event(new PasswordReset($user));
        }
    );
```

- `Password::reset()` validates the token, then calls the callback if valid.
- `forceFill()` bypasses mass-assignment protection (needed because `password` might not be in `$fillable`).
- New `remember_token` is generated to invalidate all "remember me" sessions.
- `event(new PasswordReset($user))` fires Laravel's built-in event.

```php
    if ($status === Password::PASSWORD_RESET) {
        return response()->json([
            'message' => 'Password has been reset successfully.',
        ], 200);
    }

    return response()->json([
        'message' => __($status),
    ], 422);
}
```

- `Password::PASSWORD_RESET` is a string constant (`'passwords.reset'`).
- `__($status)` translates the status string using Laravel's localization.

### `app/Http/Controllers/Api/ProductController.php`

```php
class ProductController extends Controller
{
    public function index(ProductFilterRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $paginator = Product::query()
            ->active($validated['is_active'] ?? null)
            ->minPrice($validated['min_price'] ?? null)
            ->maxPrice($validated['max_price'] ?? null)
            ->sorted($validated['sort'] ?? null)
            ->paginate(20)
            ->withQueryString();
```

- `$request->validated()` returns ONLY the validated fields (anything not in rules is stripped).
- `Product::query()` starts a query builder. Each scope method (`.active()`, `.minPrice()`, etc.) adds conditions.
- **Method chaining** - Each scope returns the Builder, so you can chain them.
- `->paginate(20)` executes the query and returns 20 items per page. It automatically reads the `?page=2` parameter.
- `->withQueryString()` preserves filter parameters in pagination links. So the "next page" link includes `?min_price=10&page=2`.

```php
        return response()->json([
            'success' => true,
            'data'    => $paginator->items(),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
            ],
            'links' => [
                'first' => $paginator->url(1),
                'last'  => $paginator->url($paginator->lastPage()),
                'prev'  => $paginator->previousPageUrl(),
                'next'  => $paginator->nextPageUrl(),
            ],
        ]);
    }
```

- Returns a standardized pagination envelope. The frontend uses `meta` to show "Page 1 of 5" and `links` for navigation buttons.

```php
    public function show(string $slug): JsonResponse
    {
        $product = Product::where('slug', $slug)->first();

        if (! $product) {
            return response()->json([
                'success' => false,
                'message' => 'Product not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Operation successful',
            'data'    => $product,
        ]);
    }
}
```

- Finds by slug (SEO-friendly URL like `wireless-headphones`) instead of numeric ID.
- Manual null check with 404 response.

### `app/Http/Controllers/Api/OrderController.php`

```php
class OrderController extends Controller
{
    public function buyNow(
        BuyNowRequest $request,
        CreateOrderFromProductAction $createOrderFromProductAction,
        ProcessPaymentAction $processPaymentAction,
    ): JsonResponse {
```

- **Constructor injection vs. Method injection** - These Action classes are injected directly into the method. Laravel resolves them from the service container. This is cleaner than injecting in the constructor because different methods might need different dependencies.

```php
        $order = $createOrderFromProductAction->execute(
            $request->user()->id,
            (int) $request->validated('product_id'),
            (int) $request->validated('quantity', 1),
        );

        $order = $processPaymentAction->execute($order, (string) $request->header('Idempotency-Key'));

        return response()->json([
            'data' => $order,
        ], 201);
    }
```

- Two steps: (1) Create the order, (2) Process the payment.
- `$request->validated('product_id')` gets a specific validated field.
- `$request->validated('quantity', 1)` defaults to 1 if not provided.

#### `reconcileOrderStatus()` - Status Synchronization

```php
    private function reconcileOrderStatus(Order $order, PaymentGatewayInterface $gateway): Order
    {
        if (app()->environment('testing')) {
            return $order->fresh(['items.product', 'payment']);
        }
```

- In tests, skip the Stripe API call and just return fresh data.

```php
        $order->loadMissing('payment', 'items.product');

        if (! $order->payment || ! in_array($order->status, [OrderStatus::Pending, OrderStatus::Processing], true)) {
            return $order->fresh(['items.product', 'payment']);
        }
```

- `loadMissing()` loads relationships only if not already loaded (prevents duplicate queries).
- Only reconcile if the order is in a non-terminal state (Pending/Processing). Completed/Cancelled/Refunded orders don't need checking.

```php
        $intent = $gateway->retrieveIntent($payment->transaction_id);
        $intentStatus = $intent['status'] ?? null;

        if ($intentStatus === 'succeeded') {
            $payment->update([
                'status'   => PaymentStatus::Paid->value,
                'paid_at'  => $payment->paid_at ?? now(),
                // ...
            ]);
            $order->update([
                'status'         => OrderStatus::Completed->value,
                'payment_status' => PaymentStatus::Paid->value,
            ]);
        }
        // Similar blocks for 'requires_action', 'processing', 'canceled'
```

- Calls Stripe API to get the current payment intent status.
- Updates local database to match Stripe's state.
- This is a **polling reconciliation** pattern - when the user views their order, we check if the payment status has changed.

### `app/Http/Controllers/Api/PaymentController.php`

```php
class PaymentController extends Controller
{
    public function webhook(Request $request): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');

        if (! $secret) {
            return response()->json([
                'message' => 'Webhook secret is not configured.',
            ], 422);
        }
```

- Reads the webhook secret from config.

```php
        try {
            $event = Webhook::constructEvent(
                $request->getContent(),     // Raw request body
                $request->header('Stripe-Signature'),  // Stripe's signature header
                $secret                      // Your webhook secret
            );
        } catch (\Throwable) {
            return response()->json([
                'message' => 'Invalid Stripe webhook signature.',
            ], 422);
        }
```

**Concept: Webhook Signature Verification**

- Stripe signs every webhook request using HMAC-SHA256 with your webhook secret.
- `Webhook::constructEvent()` verifies the signature. If someone sends a fake webhook, the signature won't match and this throws an exception.
- This is CRITICAL for security - without it, anyone could send fake "payment_intent.succeeded" events.

```php
        $payload = $event->data->object;
        $transactionId = $payload->payment_intent ?? $payload->id ?? null;

        $order = Order::query()
            ->whereHas('payment', fn ($query) => $query->where('transaction_id', $transactionId))
            ->with('payment', 'items.product')
            ->first();
```

- `whereHas()` filters orders that have a related payment with a matching transaction ID.
- `fn ($query) =>` is a PHP arrow function (short closure).

```php
        if ($event->type === 'payment_intent.succeeded') {
            $order->payment()->update([
                'status' => PaymentStatus::Paid->value,
                'paid_at' => now(),
            ]);
            $order->update([
                'status' => OrderStatus::Completed->value,
                'payment_status' => PaymentStatus::Paid->value,
            ]);
        }
```

- When payment succeeds: mark payment as "paid" and order as "completed."

```php
        if (in_array($event->type, ['charge.refunded', 'refund.updated', 'payment_intent.canceled'], true)) {
            foreach ($order->items as $item) {
                $item->product()->increment('stock', $item->quantity);
            }
            // Mark as refunded...
        }

        if ($event->type === 'payment_intent.payment_failed') {
            foreach ($order->items as $item) {
                $item->product()->increment('stock', $item->quantity);
            }
            // Mark as cancelled...
        }
```

- **Stock restoration** - When a payment is refunded or fails, the reserved stock is returned to the product.
- `->increment('stock', $item->quantity)` runs `UPDATE products SET stock = stock + $quantity` - atomic, race-condition safe.

### `app/Http/Controllers/CartController.php`

```php
class CartController extends Controller
{
    public function __construct(private CartCacheService $cache) {}
```

- **Constructor injection** with PHP 8's **constructor promotion**. `private CartCacheService $cache` simultaneously declares a property AND assigns the injected dependency. Equivalent to:
  ```php
  private CartCacheService $cache;
  public function __construct(CartCacheService $cache) {
      $this->cache = $cache;
  }
  ```

```php
    public function index(Request $request): JsonResponse
    {
        $items = $this->cache->remember($request->user()->id);
        return response()->json(['data' => $items]);
    }
```

- Gets cart items from cache (or DB if cache is cold).

```php
    public function store(AddToCartRequest $request, AddToCartAction $action): JsonResponse
    {
        $item = $action->execute(
            $request->user()->id,
            $request->validated('product_id'),
            $request->validated('quantity', 1),
        );
        return response()->json(['data' => $item], 201);
    }
```

- Delegates to `AddToCartAction`. Controller doesn't contain any business logic.
- Each method follows the same pattern: validate -> delegate -> respond.

---

## 10. Models & Eloquent ORM

Models represent database tables and define relationships between them.

### `app/Models/User.php`

```php
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;
```

- `extends Authenticatable` - Not just a Model. Authenticatable adds auth methods (password checking, "remember me" tokens, etc.).
- **PHP 8 Attributes** (the `#[...]` syntax):
  - `#[Fillable([...])]` - Defines which fields can be mass-assigned (via `User::create([...])`). Without this, Laravel blocks mass-assignment to prevent attackers from setting fields like `is_admin`.
  - `#[Hidden([...])]` - These fields are excluded when the model is serialized to JSON. You NEVER want to return `password` or `remember_token` in API responses.
- **Traits**:
  - `HasFactory` - Enables `User::factory()->create()` for testing.
  - `Notifiable` - Enables `$user->notify(new SomeNotification)` (used for password reset emails).
  - `HasApiTokens` - Adds Sanctum's token methods (`createToken()`, `tokens()`, `currentAccessToken()`).

```php
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
```

**Concept: Attribute Casting**
- `'datetime'` - The `email_verified_at` string from the database is automatically converted to a Carbon datetime object. You can do `$user->email_verified_at->diffForHumans()` to get "2 hours ago."
- `'hashed'` - Automatically hashes the password when you set it. `$user->password = 'plaintext'` stores the bcrypt hash. (Note: The RegisterController also explicitly calls `Hash::make()`, which is redundant but harmless.)

```php
    public function cart(): HasOne
    {
        return $this->hasOne(Cart::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
```

**Concept: Eloquent Relationships**
- `hasOne(Cart::class)` - A user has exactly one cart. The `carts` table has a `user_id` column pointing back.
- `hasMany(Order::class)` - A user can have many orders. The `orders` table has a `user_id` column.
- Usage: `$user->cart` (returns one Cart), `$user->orders` (returns Collection of Orders).

### `app/Models/Product.php`

```php
class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'slug', 'sku', 'description', 'image_path', 'price', 'stock', 'is_active',
    ];

    protected $casts = [
        'price'     => 'decimal:2',
        'is_active' => 'boolean',
    ];
```

- `'decimal:2'` - Price is always formatted with 2 decimal places (e.g., `"99.99"` not `99.99000001`).
- `'boolean'` - The `is_active` column (stored as 0/1 in MySQL) becomes `true`/`false` in PHP.

```php
    public function scopeActive(Builder $query, ?bool $isActive): Builder
    {
        if (is_null($isActive)) {
            return $query;
        }
        return $query->where('is_active', $isActive);
    }
```

**Concept: Query Scopes**
- Scopes are reusable query fragments. `scopeActive` is called as `Product::active(true)`.
- The `scope` prefix is stripped when calling. `scopeMinPrice` -> `->minPrice()`.
- Accepting `?bool` (nullable) means the filter is optional. If null, the scope adds nothing to the query.

```php
    public function scopeSorted(Builder $query, ?string $sort): Builder
    {
        return match ($sort) {
            'price_asc'    => $query->orderBy('price', 'asc'),
            'price_desc'   => $query->orderBy('price', 'desc'),
            'name_asc'     => $query->orderBy('name', 'asc'),
            'created_desc' => $query->orderBy('created_at', 'desc'),
            default        => $query->orderBy('created_at', 'desc'),
        };
    }
```

- `match` is PHP 8's switch expression (stricter, returns a value).
- **Whitelist pattern** - Only these 4 sort options are allowed. Prevents SQL injection through ORDER BY clause.

### `app/Models/Cart.php`

```php
class Cart extends Model
{
    protected $fillable = ['user_id'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }
}
```

- `BelongsTo` is the inverse of `HasOne`. User hasOne Cart; Cart belongsTo User.
- `HasMany` items - a cart contains multiple cart items.

### `app/Models/CartItem.php`

```php
class CartItem extends Model
{
    use HasFactory;

    protected $fillable = ['cart_id', 'product_id', 'quantity'];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(Cart::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
```

- A CartItem is a **pivot** between Cart and Product. It stores which product is in which cart and how many.
- `belongsTo(Product::class)` lets you do `$cartItem->product->name`.

### `app/Models/Order.php`

```php
class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'user_id', 'order_number', 'status', 'payment_status',
        'subtotal', 'tax', 'total', 'notes',
    ];

    protected $casts = [
        'status'         => OrderStatus::class,
        'payment_status' => PaymentStatus::class,
        'subtotal'       => 'decimal:2',
        'tax'            => 'decimal:2',
        'total'          => 'decimal:2',
    ];
```

- **SoftDeletes** - Instead of `DELETE FROM orders`, Laravel sets a `deleted_at` timestamp. The order is hidden from queries but still in the database. You can restore it later. All queries automatically add `WHERE deleted_at IS NULL`.
- `'status' => OrderStatus::class` - **Enum casting**. The string `'pending'` in the database becomes the `OrderStatus::Pending` enum case in PHP. This gives you type safety and autocomplete.

```php
    public function user(): BelongsTo { ... }
    public function items(): HasMany { ... }
    public function payment(): HasOne { ... }
```

- An order belongs to a user, has many order items, and has one payment.

### `app/Models/OrderItem.php`

```php
class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'product_id', 'product_name', 'price', 'quantity', 'total',
    ];

    protected $casts = [
        'price'    => 'decimal:2',
        'quantity' => 'integer',
        'total'    => 'decimal:2',
    ];
```

- **Why store `product_name` and `price`?** The product's name and price can change after the order. By storing them at order time, you have a permanent record of what was purchased at what price.

### `app/Models/Payment.php`

```php
class Payment extends Model
{
    protected $fillable = [
        'order_id', 'method', 'transaction_id', 'amount',
        'currency', 'status', 'metadata', 'paid_at',
    ];

    protected $casts = [
        'status'   => PaymentStatus::class,
        'amount'   => 'decimal:2',
        'metadata' => 'array',
        'paid_at'  => 'datetime',
    ];
```

- `'metadata' => 'array'` - The `metadata` column is JSON in MySQL. Laravel automatically `json_encode()`s when saving and `json_decode()`s when reading. You work with PHP arrays.
- `transaction_id` is the Stripe PaymentIntent ID (like `pi_abc123`).

---

## 11. Enums - Type-Safe Status Values

### `app/Enums/OrderStatus.php`

```php
enum OrderStatus: string
{
    case Pending    = 'pending';
    case Processing = 'processing';
    case Completed  = 'completed';
    case Cancelled  = 'cancelled';
    case Refunded   = 'refunded';
```

**Concept: PHP 8.1 Backed Enums**
- `: string` means each case has a string value stored in the database.
- `OrderStatus::Pending->value` returns `'pending'`.
- You can't create invalid statuses - `OrderStatus::from('invalid')` throws an exception.

```php
    public function allowedTransitions(): array
    {
        return match($this) {
            self::Pending    => [self::Processing, self::Cancelled],
            self::Processing => [self::Completed, self::Cancelled, self::Refunded],
            self::Completed  => [self::Refunded],
            self::Cancelled  => [],   // terminal
            self::Refunded   => [],   // terminal
        };
    }
```

**Concept: State Machine**
- Orders follow a defined lifecycle. A Pending order can become Processing or Cancelled, but NOT directly Completed.
- Cancelled and Refunded are **terminal states** - no more transitions allowed.

```
Pending -> Processing -> Completed -> Refunded
  |            |
  v            v
Cancelled  Cancelled/Refunded
```

```php
    public function canTransitionTo(self $next): bool
    {
        return in_array($next, $this->allowedTransitions());
    }

    public function label(): string
    {
        return match($this) {
            self::Pending    => 'Pending',
            // ...
        };
    }
```

- `canTransitionTo()` validates a transition before executing it.
- `label()` returns human-readable text for the frontend.

### `app/Enums/PaymentStatus.php`

```php
enum PaymentStatus: string
{
    case Pending  = 'pending';
    case Paid     = 'paid';
    case Failed   = 'failed';
    case Refunded = 'refunded';
```

Same pattern. Transitions: `Pending -> Paid -> Refunded`, `Pending -> Failed`.

---

## 12. Actions - Business Logic Layer

Actions contain the core business logic. They're plain PHP classes (not tied to HTTP).

### `app/Actions/Cart/AddToCartAction.php`

```php
class AddToCartAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId, int $productId, int $quantity = 1): CartItem
    {
        $cart = Cart::firstOrCreate(['user_id' => $userId]);
```

- `firstOrCreate()` finds the first cart for this user, or creates one if it doesn't exist. This is an **atomic** operation - safe for concurrent requests.

```php
        $item = CartItem::firstOrNew([
            'cart_id'    => $cart->id,
            'product_id' => $productId,
        ]);

        $item->quantity = ($item->exists ? $item->quantity : 0) + $quantity;
        $item->save();
```

- `firstOrNew()` is like `firstOrCreate()` but doesn't save immediately - gives you a chance to modify before saving.
- `$item->exists` is `true` if found in DB, `false` if newly created.
- If the product is already in the cart, increment quantity. Otherwise, start fresh.

```php
        $this->cache->invalidate($userId);
        return $item->load('product');
    }
}
```

- **Cache invalidation** - The cart cache is now stale (we changed it), so delete the cached version.
- `->load('product')` eager-loads the product relationship so the response includes product details.

### `app/Actions/Cart/UpdateCartItemAction.php`

```php
public function execute(int $userId, int $productId, int $quantity): CartItem
{
    $cart = Cart::where('user_id', $userId)->first();
    if (! $cart) { throw new CartItemNotFoundException(); }

    $item = CartItem::where('cart_id', $cart->id)
        ->where('product_id', $productId)
        ->first();
    if (! $item) { throw new CartItemNotFoundException(); }

    $item->update(['quantity' => $quantity]);
    $this->cache->invalidate($userId);
    return $item->load('product');
}
```

- Finds the specific cart item by cart + product, updates the quantity.
- Throws custom exception if cart or item doesn't exist.

### `app/Actions/Cart/RemoveCartItemAction.php`

```php
public function execute(int $userId, int $productId): void
{
    $cart = Cart::where('user_id', $userId)->first();
    if (! $cart) { throw new CartItemNotFoundException(); }

    $deleted = CartItem::where('cart_id', $cart->id)
        ->where('product_id', $productId)
        ->delete();

    if (! $deleted) { throw new CartItemNotFoundException(); }
    $this->cache->invalidate($userId);
}
```

- `->delete()` returns the number of deleted rows. If 0, the item didn't exist.

### `app/Actions/Cart/ClearCartAction.php`

```php
public function execute(int $userId): void
{
    $cart = Cart::where('user_id', $userId)->first();
    if (! $cart) { throw new EmptyCartException(); }

    $deleted = CartItem::where('cart_id', $cart->id)->delete();
    if (! $deleted) { throw new EmptyCartException(); }

    $this->cache->invalidate($userId);
}
```

- Deletes ALL items in the cart. If the cart was already empty, throws EmptyCartException.

### `app/Actions/Order/CreateOrderAction.php` (Cart-based Checkout)

```php
class CreateOrderAction
{
    public function __construct(private CartCacheService $cache) {}

    public function execute(int $userId): Order
    {
        return DB::transaction(function () use ($userId): Order {
```

**Concept: Database Transactions**
- `DB::transaction()` wraps everything in a database transaction. If ANY exception is thrown inside, ALL changes are rolled back. This prevents partial orders (e.g., order created but stock not decremented).

```php
            $cart = Cart::query()
                ->where('user_id', $userId)
                ->with('items')
                ->lockForUpdate()
                ->first();
```

**Concept: Pessimistic Locking**
- `lockForUpdate()` adds `FOR UPDATE` to the SQL query. This locks the cart rows so no other process can modify them until the transaction completes. Prevents race conditions where two concurrent checkouts read the same cart.

```php
            if (! $cart || $cart->items->isEmpty()) {
                throw new EmptyCartException();
            }

            $subtotal = 0.0;
            $order = Order::create([
                'user_id'        => $userId,
                'order_number'   => $this->generateOrderNumber(),
                'status'         => OrderStatus::Pending,
                'payment_status' => PaymentStatus::Pending,
                'subtotal'       => 0,
                'tax'            => 0,
                'total'          => 0,
            ]);
```

- Creates the order with zeroed totals (calculated in the loop below).

```php
            foreach ($cart->items as $cartItem) {
                $product = Product::query()
                    ->whereKey($cartItem->product_id)
                    ->lockForUpdate()
                    ->first();

                if (! $product || $product->stock < $cartItem->quantity) {
                    throw new InsufficientStockException(
                        sprintf('Insufficient stock for %s.', $product?->name ?? 'the selected product')
                    );
                }
```

- Each product is also locked (`lockForUpdate()`) to prevent selling more than available stock.
- If there's not enough stock, the whole transaction rolls back (no partial order).

```php
                $lineTotal = (float) $product->price * $cartItem->quantity;
                $subtotal += $lineTotal;

                OrderItem::create([
                    'order_id'     => $order->id,
                    'product_id'   => $product->id,
                    'product_name' => $product->name,
                    'price'        => $product->price,
                    'quantity'     => $cartItem->quantity,
                    'total'        => number_format($lineTotal, 2, '.', ''),
                ]);

                $product->decrement('stock', $cartItem->quantity);
            }
```

- For each cart item: create an order item, calculate line total, decrement stock.
- `decrement()` uses SQL `SET stock = stock - X` - atomic, no race conditions.
- `number_format($lineTotal, 2, '.', '')` formats as `"50.00"` (2 decimal places, no thousands separator).

```php
            $order->update([
                'subtotal' => number_format($subtotal, 2, '.', ''),
                'tax'      => number_format(0, 2, '.', ''),
                'total'    => number_format($subtotal, 2, '.', ''),
            ]);

            $cart->items()->delete();
            $this->cache->invalidate($userId);

            return $order->load('items.product');
        });
    }
```

- Updates order with calculated totals.
- Clears the cart (items purchased, no longer needed).
- `->load('items.product')` - **Nested eager loading**. Loads order items AND each item's product in efficient queries.

```php
    private function generateOrderNumber(): string
    {
        return sprintf('ORD-%s-%s', now()->format('YmdHis'), Str::upper(Str::random(6)));
    }
```

- Generates unique order numbers like `ORD-20260425140000-ABC123`.

### `app/Actions/Order/CreateOrderFromProductAction.php` (Buy Now)

Same pattern as CreateOrderAction but simpler - takes a single product + quantity instead of reading from the cart. Used for "Buy Now" (skip cart).

### `app/Actions/Payment/ProcessPaymentAction.php`

```php
class ProcessPaymentAction
{
    public function __construct(private PaymentGatewayInterface $gateway) {}
```

- Depends on the **interface**, not the concrete StripeGateway. This is the **Dependency Inversion Principle**.

```php
    public function execute(Order $order, string $idempotencyKey): Order
    {
        $order->loadMissing('items.product', 'payment', 'user');

        if ($order->payment) {
            return $order->fresh(['items.product', 'payment', 'user']);
        }
```

- If payment already exists (duplicate call), return the existing order without creating another payment.

```php
        try {
            $result = $this->gateway->createIntent($order, $idempotencyKey);
        } catch (\Throwable $throwable) {
            $this->restoreStock($order);
            $this->restoreCart($order);

            $order->update([
                'status'         => OrderStatus::Cancelled->value,
                'payment_status' => PaymentStatus::Failed->value,
            ]);

            throw new PaymentProcessingException($throwable->getMessage());
        }
```

**Concept: Compensating Transaction**
- If the payment gateway fails, we need to UNDO the order:
  1. **Restore stock** - Put the reserved items back in inventory
  2. **Restore cart** - Put items back in the user's cart so they can try again
  3. **Cancel the order** - Mark it as cancelled
- This is called a **compensating transaction** or **saga pattern** - when you can't use a single database transaction across multiple systems (your DB + Stripe).

```php
        return DB::transaction(function () use ($order, $result): Order {
            $order->payment()->create([
                'method'         => 'stripe',
                'transaction_id' => $result['transaction_id'],
                'amount'         => $order->total,
                'currency'       => $result['currency'] ?? 'USD',
                'status'         => PaymentStatus::Pending->value,
                'metadata'       => array_merge($result['metadata'] ?? [], [
                    'client_secret'  => $result['client_secret'],
                    'gateway_status' => $result['status'],
                ]),
            ]);

            $order->update([
                'status'         => OrderStatus::Processing->value,
                'payment_status' => PaymentStatus::Pending->value,
            ]);

            event(new OrderPlaced($order->fresh(['items.product', 'payment', 'user'])));

            return $order->fresh(['items.product', 'payment', 'user']);
        });
    }
```

- Creates a Payment record linked to the order.
- `client_secret` is stored in metadata - the frontend needs it to confirm the payment with Stripe.js.
- Order moves from Pending -> Processing.
- Fires the `OrderPlaced` event (triggers email notification).

```php
    private function restoreStock(Order $order): void
    {
        foreach ($order->items as $item) {
            $item->product()->increment('stock', $item->quantity);
        }
    }

    private function restoreCart(Order $order): void
    {
        $cart = Cart::firstOrCreate(['user_id' => $order->user_id]);
        foreach ($order->items as $item) {
            $cartItem = $cart->items()
                ->where('product_id', $item->product_id)
                ->first();

            if ($cartItem) {
                $cartItem->increment('quantity', $item->quantity);
                continue;
            }

            $cart->items()->create([
                'product_id' => $item->product_id,
                'quantity'   => $item->quantity,
            ]);
        }
        app(\App\Services\CartCacheService::class)->invalidate($order->user_id);
    }
```

- Stock restoration uses `increment()` for atomicity.
- Cart restoration handles both cases: item already in cart (increment) and item not in cart (create new).

---

## 13. Services

### `app/Services/CartCacheService.php`

```php
class CartCacheService
{
    private const PREFIX  = 'cart:v1:';
    private const TTL     = 3600;       // 1 hour
    private const LOCK_TTL = 10;        // seconds
```

- Constants define cache behavior. `v1` in the prefix allows cache key versioning (if the data structure changes, bump to `v2` and old cache is automatically abandoned).

```php
    public function key(int $userId): string
    {
        return self::PREFIX . $userId;  // e.g., "cart:v1:42"
    }
```

```php
    public function remember(int $userId): array
    {
        $cacheKey = $this->key($userId);

        // Fast path - already cached
        if (Cache::has($cacheKey)) {
            return Cache::get($cacheKey);
        }
```

**Concept: Cache-Aside Pattern**
1. Check cache first (fast path)
2. If miss, load from database
3. Store in cache for next time

```php
        // Stampede prevention: only one process rebuilds the cache
        $lock = Cache::lock("lock:{$cacheKey}", self::LOCK_TTL);

        return $lock->block(5, function () use ($cacheKey, $userId) {
            // Re-check after acquiring lock
            if (Cache::has($cacheKey)) {
                return Cache::get($cacheKey);
            }

            $cart = Cart::firstOrCreate(['user_id' => $userId]);
            $items = $cart->items()->with('product')->get()->toArray();
            Cache::put($cacheKey, $items, self::TTL);
            return $items;
        });
    }
```

**Concept: Cache Stampede Prevention**
- If 100 users hit an expired cache simultaneously, without locking, all 100 would query the database.
- `Cache::lock()` ensures only ONE process rebuilds the cache. Others wait up to 5 seconds.
- After acquiring the lock, re-check the cache (another process might have rebuilt it while we waited).

```php
    public function invalidate(int $userId): void
    {
        Cache::forget($this->key($userId));
    }
```

- Deletes the cached cart when any cart mutation happens.

### `app/Services/Payments/StripeGateway.php`

```php
class StripeGateway implements PaymentGatewayInterface
{
    public function __construct(private ?StripeClient $client = null)
    {
        $secret = config('services.stripe.secret');
        if ($this->client === null && $secret) {
            $this->client = new StripeClient($secret);
        }
    }
```

- Accepts an optional StripeClient (for testing/mocking).
- If none provided, creates one using the secret key from config.

```php
    public function createIntent(Order $order, string $idempotencyKey): array
    {
        if (app()->environment('testing') || ! $this->client) {
            return [
                'transaction_id' => 'pi_mock_'.$order->id,
                'client_secret'  => 'mock_secret_'.$order->id,
                'status'         => 'requires_confirmation',
                'currency'       => 'USD',
                'amount'         => (int) round(((float) $order->total) * 100),
                'metadata'       => [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->order_number,
                    'mode' => 'mock',
                ],
            ];
        }
```

- **Mock in testing** - Returns fake data during tests so you don't need a real Stripe account.

```php
        $amount = (int) round(((float) $order->total) * 100);
        $currency = strtolower(config('services.stripe.currency', 'usd'));

        $intent = $this->client->paymentIntents->create(
            [
                'amount' => $amount,
                'currency' => $currency,
                'payment_method_types' => ['card'],
                'metadata' => [
                    'order_id' => (string) $order->id,
                    'order_number' => $order->order_number,
                ],
            ],
            [
                'idempotency_key' => $idempotencyKey,
            ]
        );
```

**Concept: Stripe Payment Intents**
- Stripe amounts are in **cents** (smallest currency unit). $99.99 = 9999 cents.
- `payment_method_types: ['card']` - Only accept card payments.
- `metadata` - Custom data stored on the Stripe side (useful for debugging in the Stripe dashboard).
- `idempotency_key` - Stripe's own idempotency. If the same key is sent twice, Stripe returns the first result instead of creating a duplicate payment.

```php
        return [
            'transaction_id' => $intent->id,           // e.g., "pi_3Abc..."
            'client_secret'  => $intent->client_secret, // Frontend uses this
            'status'         => $intent->status,       // "requires_confirmation"
            'currency'       => strtoupper($intent->currency),
            'amount'         => $intent->amount,
            'metadata'       => $intent->metadata?->toArray() ?? [],
        ];
    }
```

- `client_secret` is sent to the frontend. It's used by Stripe.js to confirm the payment on the client side.

---

## 14. Contracts (Interfaces)

### `app/Contracts/PaymentGatewayInterface.php`

```php
interface PaymentGatewayInterface
{
    /**
     * @return array{
     *     transaction_id: string,
     *     client_secret: string|null,
     *     status: string,
     *     currency: string,
     *     amount: int,
     *     metadata: array<string, mixed>
     * }
     */
    public function createIntent(Order $order, string $idempotencyKey): array;

    /**
     * @return array{
     *     transaction_id: string,
     *     status: string,
     *     currency: string|null,
     *     amount: int|null,
     *     metadata: array<string, mixed>
     * }
     */
    public function retrieveIntent(string $transactionId): array;
}
```

**Concept: Interface / Contract**
- An interface is a **contract** - it says "any class that implements me MUST have these methods with these signatures."
- `StripeGateway implements PaymentGatewayInterface` - it MUST have `createIntent()` and `retrieveIntent()`.
- If you add a `PayPalGateway`, it must also implement both methods.
- The `@return array{...}` PHPDoc defines the shape of the returned array (like TypeScript's `{ transaction_id: string, ... }`).

---

## 15. Events & Listeners

### `app/Events/OrderPlaced.php`

```php
class OrderPlaced
{
    use Dispatchable, SerializesModels;

    public function __construct(public Order $order) {}
}
```

- `Dispatchable` - Adds static `dispatch()` method: `OrderPlaced::dispatch($order)`.
- `SerializesModels` - When queued, the Order is serialized as just its ID (not the whole object). When the listener runs, it re-fetches from the database. Prevents stale data.
- `public Order $order` - **Constructor promotion** + public property. The listener accesses it via `$event->order`.

### `app/Listeners/SendOrderConfirmationListener.php`

```php
class SendOrderConfirmationListener implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        $order = $event->order->loadMissing('user');

        Mail::raw(
            sprintf(
                'Thanks for your order %s. Total: $%s. Current status: %s.',
                $order->order_number,
                number_format((float) $order->total, 2, '.', ''),
                $order->status->value
            ),
            function ($message) use ($order): void {
                $message->to($order->user->email)
                    ->subject(sprintf('Order confirmation %s', $order->order_number));
            }
        );
    }
}
```

- `implements ShouldQueue` - This listener runs as a **background job**. The checkout response returns immediately; the email is sent asynchronously by the queue worker.
- `Mail::raw()` sends a plain-text email. In production, you'd use a Mailable class with HTML templates.
- **Why queue?** Sending emails takes 1-3 seconds. You don't want the user waiting for an email to be sent before seeing their order confirmation.

---

## 16. Custom Exceptions

### Pattern: Self-Rendering Exceptions

All four exceptions follow the same pattern:

```php
class CartItemNotFoundException extends Exception
{
    public function __construct(string $message = 'Cart item not found')
    {
        parent::__construct($message);
    }

    public function render(): JsonResponse
    {
        return response()->json([
            'message' => $this->getMessage(),
            'error'   => 'CART_ITEM_NOT_FOUND',
        ], 404);
    }
}
```

**Concept: Self-Rendering Exceptions**
- When Laravel catches an exception that has a `render()` method, it calls that method to generate the response.
- No need for try/catch in controllers. You just `throw new CartItemNotFoundException()` anywhere in your code, and Laravel handles the rest.
- The `error` field is a **machine-readable error code** (the frontend can check `error === 'CART_ITEM_NOT_FOUND'` instead of parsing the human message).

| Exception | Error Code | HTTP Status | When Thrown |
|-----------|-----------|-------------|------------|
| `CartItemNotFoundException` | CART_ITEM_NOT_FOUND | 404 | Item not in cart |
| `EmptyCartException` | EMPTY_CART | 422 | Checkout with empty cart |
| `InsufficientStockException` | INSUFFICIENT_STOCK | 422 | Not enough stock |
| `PaymentProcessingException` | PAYMENT_PROCESSING_FAILED | 422 | Stripe API error |

---

## 17. Database: Migrations

Migrations are version-controlled database schema changes. Run them with `php artisan migrate`.

### Users, Sessions, Password Resets

```php
Schema::create('users', function (Blueprint $table) {
    $table->id();                                    // BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
    $table->string('name');                          // VARCHAR(255)
    $table->string('email')->unique();               // VARCHAR(255) with UNIQUE index
    $table->timestamp('email_verified_at')->nullable(); // TIMESTAMP, can be NULL
    $table->string('password');                      // VARCHAR(255) (stores bcrypt hash)
    $table->rememberToken();                         // VARCHAR(100) for "remember me"
    $table->timestamps();                            // created_at + updated_at TIMESTAMPS
});
```

- `$table->id()` is shorthand for `$table->bigIncrements('id')` - auto-incrementing unsigned big integer.
- `->unique()` creates a unique database index (prevents duplicate emails at the DB level, not just validation).
- `->nullable()` allows NULL values (email might not be verified yet).
- `$table->timestamps()` adds `created_at` and `updated_at` columns. Laravel sets `created_at` on creation and updates `updated_at` on every save.

```php
Schema::create('password_reset_tokens', function (Blueprint $table) {
    $table->string('email')->primary();   // Email is the primary key
    $table->string('token');              // The hashed reset token
    $table->timestamp('created_at')->nullable();
});
```

- One token per email. If a user requests another reset, the old token is replaced.

```php
Schema::create('sessions', function (Blueprint $table) {
    $table->string('id')->primary();
    $table->foreignId('user_id')->nullable()->index();
    $table->string('ip_address', 45)->nullable();   // 45 chars for IPv6
    $table->text('user_agent')->nullable();
    $table->longText('payload');                     // Serialized session data
    $table->integer('last_activity')->index();       // Unix timestamp
});
```

### Cache & Cache Locks

```php
Schema::create('cache', function (Blueprint $table) {
    $table->string('key')->primary();
    $table->mediumText('value');
    $table->bigInteger('expiration')->index();
});

Schema::create('cache_locks', function (Blueprint $table) {
    $table->string('key')->primary();
    $table->string('owner');                  // Which process holds the lock
    $table->bigInteger('expiration')->index();
});
```

- These are for the `database` cache driver. This project uses `redis`, so these tables exist but aren't actively used.

### Jobs, Failed Jobs, Job Batches

```php
Schema::create('jobs', function (Blueprint $table) {
    $table->id();
    $table->string('queue')->index();         // Queue name (e.g., "default", "emails")
    $table->longText('payload');              // Serialized job data
    $table->unsignedTinyInteger('attempts');   // How many times tried
    $table->unsignedInteger('reserved_at')->nullable();
    $table->unsignedInteger('available_at');   // When the job becomes runnable
    $table->unsignedInteger('created_at');
});
```

- Again, for `database` queue driver. This project uses `redis`.

### Personal Access Tokens (Sanctum)

```php
Schema::create('personal_access_tokens', function (Blueprint $table) {
    $table->id();
    $table->morphs('tokenable');              // Creates tokenable_type + tokenable_id
    $table->text('name');                     // Token name ("api-token")
    $table->string('token', 64)->unique();    // SHA-256 hash of the token
    $table->text('abilities')->nullable();     // JSON array of abilities
    $table->timestamp('last_used_at')->nullable();
    $table->timestamp('expires_at')->nullable()->index();
    $table->timestamps();
});
```

- `morphs('tokenable')` creates a **polymorphic relationship**. It stores the model type (`App\Models\User`) and ID. This allows any model to have tokens.
- The `token` column stores a HASH, not the plain token. Even if the database leaks, the tokens are unusable.

### Products

```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->string('name');
    $table->string('slug')->unique();
    $table->text('description')->nullable();
    $table->decimal('price', 10, 2);          // Up to 99,999,999.99
    $table->unsignedInteger('stock')->default(0);
    $table->string('sku')->unique();           // Stock Keeping Unit
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();                     // Adds deleted_at column

    // Composite indexes for common queries
    $table->index(['is_active', 'stock'], 'idx_products_active_stock');
    $table->index('price', 'idx_products_price');
});
```

- `decimal(10, 2)` means up to 10 digits total, 2 after the decimal. Max value: 99,999,999.99.
- `softDeletes()` adds a `deleted_at` TIMESTAMP column. Products are never truly deleted.
- **Indexes** speed up queries. `idx_products_active_stock` is a composite index optimizing queries that filter by `is_active` AND `stock` (common for "show active, in-stock products").

Later migration adds image_path:

```php
Schema::table('products', function (Blueprint $table) {
    $table->string('image_path')->nullable()->after('description');
});
```

- `->after('description')` positions the column after `description` (MySQL only).

### Carts

```php
Schema::create('carts', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
    $table->timestamps();
});
```

- `foreignId('user_id')` creates an unsigned big integer column.
- `->constrained()` adds a foreign key constraint (`REFERENCES users(id)`).
- `->unique()` ensures one cart per user.
- `->cascadeOnDelete()` means if the user is deleted, their cart is automatically deleted too.

### Cart Items

```php
Schema::create('cart_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('cart_id')->constrained()->onDelete('cascade');
    $table->foreignId('product_id')->constrained()->onDelete('cascade');
    $table->unsignedInteger('quantity')->default(1);
    $table->timestamps();
    $table->unique(['cart_id', 'product_id'], 'idx_cart_items_cart_product');
});
```

- `unique(['cart_id', 'product_id'])` - A product can only appear ONCE per cart (enforced at the database level). The application handles duplicates by incrementing quantity.

### Orders

```php
Schema::create('orders', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained()->onDelete('cascade');
    $table->string('order_number')->unique();
    $table->string('status', 50)->default('pending');
    $table->string('payment_status', 50)->default('pending');
    $table->decimal('subtotal', 10, 2);
    $table->decimal('tax', 10, 2)->default(0);
    $table->decimal('total', 10, 2);
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletes();
    $table->index(['user_id', 'status'], 'idx_orders_user_status');
    $table->index('created_at', 'idx_orders_created');
});
```

- `status` and `payment_status` are strings that match the enum values.
- `idx_orders_user_status` optimizes "get all orders for user X with status Y."

### Order Items

```php
Schema::create('order_items', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained()->onDelete('cascade');
    $table->foreignId('product_id')->constrained();  // No cascade - keep history
    $table->string('product_name');
    $table->decimal('price', 10, 2);
    $table->unsignedInteger('quantity');
    $table->decimal('total', 10, 2);
    $table->timestamps();
    $table->index(['order_id', 'product_id'], 'idx_order_items_order_product');
});
```

- `product_id` has NO cascade delete. If a product is deleted, the order item remains (preserving order history).

### Payments

```php
Schema::create('payments', function (Blueprint $table) {
    $table->id();
    $table->foreignId('order_id')->constrained()->onDelete('cascade');
    $table->string('method', 50);             // e.g., "stripe"
    $table->string('transaction_id')->nullable(); // Stripe PaymentIntent ID
    $table->decimal('amount', 10, 2);
    $table->char('currency', 3)->default('USD');  // ISO 4217 (USD, EUR, etc.)
    $table->string('status', 50)->default('pending');
    $table->json('metadata')->nullable();     // JSON column for extra data
    $table->timestamp('paid_at')->nullable();
    $table->timestamps();
    $table->index('transaction_id', 'idx_payments_transaction');
    $table->index(['order_id', 'status'], 'idx_payments_order_status');
});
```

- `char(3)` - Fixed-length string, always 3 characters (ISO 4217 currency codes).
- `json('metadata')` - Native JSON column. Stores things like `client_secret`, `gateway_status`, etc.

---

## 18. Database: Seeders & Factories

### `database/seeders/DatabaseSeeder.php`

```php
class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ProductSeeder::class,
        ]);
    }
}
```

- The main seeder. Run with `php artisan db:seed`. Calls other seeders in order.

### `database/seeders/ProductSeeder.php`

```php
class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            [
                'name'        => 'Wireless Headphones',
                'description' => 'Premium noise-cancelling wireless headphones.',
                'price'       => 99.99,
                'stock'       => 50,
                'sku'         => 'WH-001',
                'is_active'   => true,
            ],
            // ... 9 more products ...
        ];

        foreach ($products as $data) {
            $seed = rawurlencode(Str::slug($data['name']));
            Product::create([
                ...$data,                            // Spread operator
                'slug' => Str::slug($data['name']),  // "Wireless Headphones" -> "wireless-headphones"
                'image_path' => "https://picsum.photos/seed/{$seed}/800/800",
            ]);
        }
    }
}
```

- `Str::slug()` converts text to URL-friendly format.
- `...$data` is PHP's **spread operator** - unpacks the array into key-value pairs.
- `picsum.photos` provides random placeholder images seeded by the slug (same slug = same image).
- Note: The last product (Monitor 27") has `stock: 0` and `is_active: false` - useful for testing filters.

### `database/factories/UserFactory.php`

```php
class UserFactory extends Factory
{
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }
```

- `fake()` returns a Faker instance. `fake()->name()` generates "John Doe", `fake()->safeEmail()` generates "john@example.com".
- `static::$password ??= Hash::make('password')` - **Null coalescing assignment**. Hashes the password ONCE and reuses it. Bcrypt is slow (~100ms), so this avoids hashing "password" 100 times when creating 100 test users.
- `->unique()` ensures no duplicate emails.

```php
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
```

- `state()` modifies factory output. `User::factory()->unverified()->create()` creates a user without email verification.

### `database/factories/ProductFactory.php`

```php
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = $this->faker->unique()->words(3, true);
        $slug = Str::slug($name);
        return [
            'name'        => ucfirst($name),
            'slug'        => $slug,
            'sku'         => strtoupper(Str::random(8)),
            'description' => $this->faker->sentence(),
            'image_path'  => "https://picsum.photos/seed/{$slug}/800/800",
            'price'       => $this->faker->randomFloat(2, 5, 500),
            'stock'       => $this->faker->numberBetween(0, 100),
            'is_active'   => true,
        ];
    }
}
```

- `$this->faker->words(3, true)` generates 3 random words as a string.
- `randomFloat(2, 5, 500)` generates a decimal between 5.00 and 500.00.

### `database/factories/CartItemFactory.php`

```php
class CartItemFactory extends Factory
{
    public function definition(): array
    {
        $user = User::factory()->create();
        return [
            'cart_id'    => Cart::firstOrCreate(['user_id' => $user->id])->id,
            'product_id' => Product::factory(),
            'quantity'   => $this->faker->numberBetween(1, 5),
        ];
    }

    public function forUser(User|int $user): self
    {
        $userId = $user instanceof User ? $user->id : $user;
        return $this->state(fn () => [
            'cart_id' => Cart::firstOrCreate(['user_id' => $userId])->id,
        ]);
    }
}
```

- `forUser()` is a custom state method. `CartItem::factory()->forUser($user)->create()` creates a cart item for a specific user.
- `User|int` is a **union type** - accepts either a User object or an integer ID.

---

## 19. Docker Infrastructure

### `docker-compose.yml`

This defines 6 services that work together:

```
                    ┌─────────┐
            :8000   │  Nginx  │
     ──────────────>│ (proxy) │
                    └────┬────┘
                         │ FastCGI (:9000)
                    ┌────▼────┐
                    │   App   │ (PHP-FPM)
                    └────┬────┘
                    ┌────┴────┐
              ┌─────▼─┐  ┌──▼───┐
              │ MySQL  │  │ Redis│
              └────────┘  └──────┘

    ┌──────────┐  ┌───────────┐
    │  Queue   │  │ Scheduler │
    │  Worker  │  │ (cron)    │
    └──────────┘  └───────────┘
```

#### App Service (PHP-FPM)

```yaml
app:
    build:
      context: .
      dockerfile: docker/php/Dockerfile
    working_dir: /var/www/html
    volumes:
      - .:/var/www/html
      - ./docker/php/php.ini:/usr/local/etc/php/conf.d/custom.ini
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_healthy
```

- `build: context: .` - Build the image from the current directory using the specified Dockerfile.
- `volumes: .:/var/www/html` - **Bind mount**. Your local code is synced into the container. Changes on your machine appear instantly inside the container.
- `depends_on: ... condition: service_healthy` - The app won't start until MySQL and Redis pass their health checks.

#### MySQL with Health Check

```yaml
mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ${DB_DATABASE}
      MYSQL_USER: ${DB_USERNAME}
      MYSQL_PASSWORD: ${DB_PASSWORD}
      MYSQL_ROOT_PASSWORD: ${DB_ROOT_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-p${DB_ROOT_PASSWORD}"]
      interval: 10s
      timeout: 5s
      retries: 5
```

- `${DB_DATABASE}` reads from `.env` file.
- `mysql_data:/var/lib/mysql` - A **named volume**. Data persists between container restarts (unlike bind mounts which sync with your filesystem).
- **Health check** - Docker pings MySQL every 10 seconds. After 5 failed attempts, the container is marked unhealthy.

#### Redis

```yaml
redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
```

- `--appendonly yes` - Enables AOF (Append Only File) persistence. Redis writes every command to disk. If Redis crashes, data is recovered on restart.
- `--requirepass` - Requires a password for all connections.

#### Queue Worker

```yaml
queue:
    command: php artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
```

- `queue:work` - Long-running process that pulls jobs from Redis and executes them.
- `--sleep=3` - If the queue is empty, wait 3 seconds before checking again.
- `--tries=3` - Retry failed jobs up to 3 times.
- `--max-time=3600` - Restart the worker after 1 hour (prevents memory leaks).

#### Scheduler

```yaml
scheduler:
    command: sh -c "while true; do php artisan schedule:run --verbose --no-interaction & sleep 60; done"
```

- Simulates cron inside Docker. Runs `schedule:run` every 60 seconds.
- The `&` runs it in the background so the sleep starts immediately (not after the command finishes).

---

## 20. Testing

### Test Structure

Tests use `RefreshDatabase` which runs all migrations before each test and rolls back after. Each test gets a clean database.

### `tests/Feature/AuthTest.php`

Tests the complete auth flow:

| Test | What It Verifies |
|------|-----------------|
| `test_user_can_register` | Registration creates user + returns token |
| `test_register_fails_with_duplicate_email` | Duplicate email returns 422 |
| `test_register_fails_with_mismatched_password_confirmation` | Mismatched passwords return 422 |
| `test_user_can_login` | Valid credentials return token |
| `test_login_fails_with_wrong_password` | Wrong password returns 422 |
| `test_login_fails_with_unknown_email` | Unknown email returns 422 |
| `test_user_can_logout` | Logout deletes the token from DB |
| `test_logout_requires_authentication` | Unauthenticated logout returns 401 |
| `test_forgot_password_sends_reset_link` | Sends notification to existing user |
| `test_forgot_password_returns_200_for_unknown_email` | Returns 200 even for nonexistent email (prevents enumeration) |
| `test_password_can_be_reset_with_valid_token` | Valid token + new password works |
| `test_password_reset_fails_with_invalid_token` | Bad token returns 422 |

Key testing patterns used:

```php
// Fake notifications (capture them instead of sending)
Notification::fake();
Notification::assertSentTo($user, ResetPassword::class);
Notification::assertNothingSent();

// Assert database state
$this->assertDatabaseHas('users', ['email' => 'alice@example.com']);
$this->assertDatabaseCount('personal_access_tokens', 0);

// Assert HTTP response
$response->assertCreated()           // 201
         ->assertOk()                // 200
         ->assertUnprocessable()     // 422
         ->assertUnauthorized()      // 401
         ->assertJsonStructure([...])
         ->assertJson(['key' => 'value'])
         ->assertJsonValidationErrors(['field']);

// Generate real password reset tokens
$token = Password::createToken($user);
```

### `tests/Feature/CartTest.php`

Tests all cart operations:

| Test | What It Verifies |
|------|-----------------|
| `test_get_cart_returns_empty_for_new_user` | New user gets empty cart |
| `test_get_cart_eager_loads_product` | Cart items include product data |
| `test_add_item_to_cart` | Adding creates cart item |
| `test_adding_existing_item_increments_quantity` | Adding same product increments qty |
| `test_update_cart_item_quantity` | PUT updates quantity |
| `test_update_returns_404_for_missing_item` | Missing item returns 404 |
| `test_remove_cart_item` | DELETE removes specific item |
| `test_clear_cart` | DELETE /cart removes all items |
| `test_clear_empty_cart_returns_422` | Can't clear empty cart |
| `test_cache_is_invalidated_on_add/remove/clear` | Cache busted on mutations |
| `test_cart_routes_require_authentication` | All cart routes return 401 without token |

Cache testing pattern:

```php
$cacheKey = "cart:v1:{$this->user->id}";
Cache::put($cacheKey, ['stale' => 'data'], 3600);  // Manually seed cache

// Perform action...

$this->assertFalse(Cache::has($cacheKey));  // Cache was invalidated
```

### `tests/Feature/CheckoutTest.php`

Tests the full checkout flow:

| Test | What It Verifies |
|------|-----------------|
| `test_checkout_creates_order_and_clears_cart` | Full flow: order + payment + stock decrement + cart cleared |
| `test_checkout_returns_empty_cart_error` | Empty cart returns 422 |
| `test_checkout_returns_insufficient_stock_error` | Stock checked; no partial order |
| `test_checkout_is_idempotent_for_duplicate_key` | Same idempotency key = same order |
| `test_buy_now_creates_order_without_cart` | Buy-now bypasses cart |

Idempotency testing:

```php
$firstResponse = $this->actingAs($user)
    ->withHeader('Idempotency-Key', 'checkout-duplicate')
    ->postJson('/api/v1/checkout');

$secondResponse = $this->actingAs($user)
    ->withHeader('Idempotency-Key', 'checkout-duplicate')
    ->postJson('/api/v1/checkout');

$secondResponse->assertJsonPath('data.id', $firstResponse->json('data.id'));
$this->assertSame(1, Order::count());  // Only ONE order created
```

### `tests/Feature/PaymentTest.php`

Tests payment processing and webhooks:

| Test | What It Verifies |
|------|-----------------|
| `test_checkout_creates_pending_payment_and_processing_order` | Order starts as processing, payment as pending |
| `test_gateway_failure_cancels_order_and_restocks` | Gateway error -> stock restored, cart restored, order cancelled |
| `test_webhook_marks_payment_complete_when_signature_is_valid` | Valid webhook -> order completed |
| `test_webhook_rejects_invalid_signature` | Bad signature -> 422 |

Gateway mocking pattern:

```php
private function bindGateway(array $result = [], ?\Throwable $throwable = null): void
{
    $this->app->bind(PaymentGatewayInterface::class, function () use ($result, $throwable) {
        return new class($result, $throwable) implements PaymentGatewayInterface {
            // Anonymous class implementing the interface
            public function createIntent(Order $order, string $idempotencyKey): array
            {
                if ($this->throwable) throw $this->throwable;
                return array_merge([/* defaults */], $this->result);
            }
        };
    });
}
```

- Replaces the real Stripe gateway with a fake one in the service container.
- Can simulate success (custom result array) or failure (throwable).

Webhook signature generation:

```php
private function stripeSignature(string $payload, string $secret, ?int $timestamp = null): string
{
    $timestamp ??= time();
    $signedPayload = $timestamp.'.'.$payload;
    $signature = hash_hmac('sha256', $signedPayload, $secret);
    return sprintf('t=%d,v1=%s', $timestamp, $signature);
}
```

- Recreates Stripe's signature format for testing.

---

## 21. Data Flow Walkthroughs

### Flow 1: User Registration

```
POST /api/auth/register
    { name: "Alice", email: "alice@test.com", password: "secret123", password_confirmation: "secret123" }

1. Nginx receives request -> forwards to PHP-FPM
2. public/index.php -> bootstrap/app.php -> builds Application
3. Router matches: Route::post('/register', RegisterController::class)
4. Middleware: 'throttle:register' checks rate limit (3/min per IP)
5. RegisterRequest validates: name required, email unique, password min:8+confirmed
6. RegisterController::__invoke() runs:
   - User::create() -> INSERT INTO users
   - $user->createToken() -> INSERT INTO personal_access_tokens
7. Returns: { token: "1|abc...", user: { id: 1, name: "Alice", email: "..." } }
   Status: 201 Created
```

### Flow 2: Full Checkout

```
POST /api/v1/checkout
    Headers: Authorization: Bearer <token>, Idempotency-Key: <uuid>

1. Middleware stack:
   a. auth:sanctum -> validates Bearer token -> attaches $user
   b. throttle:checkout -> checks rate limit (10/min per user)
   c. idempotency -> checks if this key was seen before
      - If yes: return cached response (201 + same order data)
      - If no: continue...

2. OrderController::checkout() runs:
   a. CreateOrderAction::execute($userId):
      - DB::transaction() begins
      - Lock cart row (SELECT ... FOR UPDATE)
      - Check cart not empty
      - Create Order (status: pending)
      - For each cart item:
        - Lock product row
        - Check stock >= quantity
        - Create OrderItem
        - Decrement product stock
      - Update order totals
      - Delete cart items
      - Invalidate cart cache
      - DB::transaction() commits

   b. ProcessPaymentAction::execute($order, $idempotencyKey):
      - StripeGateway::createIntent() -> calls Stripe API
        - Creates PaymentIntent in Stripe
        - Returns client_secret + transaction_id
      - DB::transaction():
        - Create Payment record
        - Update order -> status: processing
        - Fire OrderPlaced event

3. OrderPlaced event -> queue -> SendOrderConfirmationListener
   (Asynchronous: email sent by queue worker)

4. Idempotency middleware caches the response (24 hours)

5. Returns: { data: { id: 1, status: "processing", payment: {...}, items: [...] } }
   Status: 201 Created
```

### Flow 3: Stripe Webhook (Payment Confirmed)

```
POST /api/v1/payments/webhook
    Headers: Stripe-Signature: t=123,v1=abc...
    Body: { type: "payment_intent.succeeded", data: { object: { id: "pi_abc" } } }

1. NO auth middleware (Stripe can't log in as a user)
2. PaymentController::webhook():
   a. Verify signature using Stripe SDK
   b. Find order by payment's transaction_id
   c. event type = "payment_intent.succeeded":
      - Update payment: status -> paid, paid_at -> now()
      - Update order: status -> completed, payment_status -> paid
3. Returns: { message: "Webhook processed." }
   Status: 200
```

---

## 22. What You Could Build Next

Here are features the project is prepared for but doesn't have yet:

### Easy to Add
1. **Product Categories** - Add a `categories` table + many-to-many pivot with products
2. **Product Search** - Add a `scopeSearch()` that uses `WHERE name LIKE %term%` or MySQL FULLTEXT
3. **User Profile** - Add `GET /api/auth/me` returning the authenticated user
4. **Order Cancellation** - Add `POST /api/v1/orders/{id}/cancel` using the state machine
5. **Shipping Address** - Add an `addresses` table, require address at checkout
6. **Tax Calculation** - The `tax` field exists, just needs calculation logic
7. **Product Reviews** - `reviews` table with `user_id`, `product_id`, `rating`, `comment`

### Medium Complexity
8. **Admin Panel** - Admin middleware + controllers for product CRUD, order management
9. **Coupon/Discount System** - `coupons` table, apply at checkout, adjust totals
10. **Wishlist** - Similar to cart but without checkout flow
11. **Email Templates** - Replace `Mail::raw()` with proper Mailable classes + Blade templates
12. **Image Upload** - Use Laravel's filesystem to store product images (S3 or local)
13. **Inventory Alerts** - Event when stock hits threshold, notify admin

### Advanced
14. **Real-time Order Updates** - Laravel Broadcasting (WebSockets) for live status
15. **Multiple Payment Methods** - Add PayPal gateway implementing `PaymentGatewayInterface`
16. **API Versioning** - The `/v1` prefix is already there; add `/v2` for breaking changes
17. **Full-text Search** - Laravel Scout with Meilisearch/Algolia
18. **API Rate Limiting per Plan** - Different limits for free vs. premium users

---

## Glossary of Key Concepts

| Concept | What It Is |
|---------|-----------|
| **Eloquent ORM** | Laravel's database abstraction. Models map to tables, relationships are defined in PHP |
| **Service Container** | Laravel's IoC container. Manages class dependencies and performs injection |
| **Middleware** | Code that runs before/after a request reaches a controller |
| **Form Request** | A class that validates and authorizes incoming HTTP requests |
| **Migration** | Version-controlled database schema change |
| **Factory** | Generates fake model instances for testing |
| **Seeder** | Populates the database with sample data |
| **Enum** | A type with a fixed set of possible values |
| **Event/Listener** | Decoupled communication pattern. Events are fired; listeners react |
| **Queue/Job** | Work deferred to background processing |
| **Sanctum** | Laravel's lightweight API token authentication |
| **Rate Limiting** | Restricting how many requests a client can make per time period |
| **Idempotency** | Making duplicate requests safe (same result, no side effects) |
| **Soft Deletes** | Marking records as deleted without removing from database |
| **Eager Loading** | Loading relationships in advance to avoid N+1 query problems |
| **PSR-4** | PHP autoloading standard mapping namespaces to directories |
| **CORS** | Browser security mechanism controlling cross-origin HTTP requests |
| **Webhook** | An HTTP callback. External service (Stripe) sends data to your server |
| **Payment Intent** | Stripe's object representing a payment-in-progress |
| **Cache Stampede** | When many concurrent requests hit an expired cache simultaneously |
| **Pessimistic Lock** | Database row lock preventing concurrent modifications |
| **Compensating Transaction** | Undoing a partial operation when a later step fails |

---

*Generated from the codebase at commit `4c4eebf` (main branch).*
