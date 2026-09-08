<?php

use App\Providers\AppServiceProvider;
use App\Providers\EventServiceProvider;
use App\Providers\RateLimitServiceProvider;
return [
    AppServiceProvider::class,
    EventServiceProvider::class,
    RateLimitServiceProvider::class,
];
