<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\RegisterController;
use Illuminate\Support\Facades\Route;


Route::prefix('auth')->group(function () {

    Route::post('/register', RegisterController::class)
        ->middleware('throttle:register');   

    Route::post('/login', LoginController::class)
        ->middleware('throttle:login');      

    Route::post('/logout', LogoutController::class)
        ->middleware('auth:sanctum');

});