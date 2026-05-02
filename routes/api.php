<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\ForgotPasswordController;
use App\Http\Controllers\Auth\ResetPasswordController;
use App\Http\Controllers\Auth\UserController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CartController;

Route::prefix('auth')->group(function () {

    Route::post('/register', RegisterController::class)
        ->middleware('throttle:register');   

    Route::post('/login', LoginController::class)
        ->middleware('throttle:login');      

    Route::post('/logout', LogoutController::class)
        ->middleware('auth:sanctum');

    Route::get('/user', [UserController::class, 'show'])
        ->middleware('auth:sanctum');

    Route::put('/user', [UserController::class, 'update'])
        ->middleware(['auth:sanctum', 'throttle:10,1']);

    Route::post('/password/forgot', ForgotPasswordController::class)
        ->middleware('throttle:login');

    Route::post('/password/reset', ResetPasswordController::class)
        ->middleware('throttle:login');

});

Route::prefix('v1')->group(function () {

    // ── Public — Product Catalog ──────────────────────────────
    Route::get('/products',      [ProductController::class, 'index']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    Route::middleware(['auth:sanctum', 'throttle:checkout'])
        ->group(function () {
            Route::post('/buy-now', [OrderController::class, 'buyNow'])
                ->middleware('idempotency');
            Route::post('/checkout', [OrderController::class, 'checkout'])
                ->middleware('idempotency');
            Route::get('/orders', [OrderController::class, 'index']);
            Route::get('/orders/{id}', [OrderController::class, 'show']);
            Route::post('/orders/{id}/cancel', [OrderController::class, 'cancel']);
        });

    Route::post('/payments/webhook', [PaymentController::class, 'webhook']);

});


    // ── Protected — Cart Management ──────────────────────────────
   Route::middleware(['auth:sanctum', 'throttle:cart'])
    ->prefix('cart')
    ->group(function () {
        Route::get('/',                     [CartController::class, 'index']);
        Route::post('/items',               [CartController::class, 'store']);
        Route::put('/items/{productId}',    [CartController::class, 'update']);
        Route::delete('/items/{productId}', [CartController::class, 'destroy']);
        Route::delete('/',                  [CartController::class, 'clear']);
    });