<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Route;

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

    try {
        Cache::store('redis')->put('health-check', now()->timestamp, 10);
        Cache::store('redis')->forget('health-check');
    } catch (\Throwable) {
        $services['redis'] = 'failed';
    }

    try {
        Queue::connection()->size();
    } catch (\Throwable) {
        $services['queue'] = 'failed';
    }

    $status = in_array('failed', $services, true) ? 'degraded' : 'ok';

    return response()->json([
        'status' => $status,
        'services' => $services,
        'timestamp' => now()->toISOString(),
    ], $status === 'ok' ? 200 : 503);
});
