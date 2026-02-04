<?php

namespace App\Providers;

use App\Services\DashboardService;
use App\Services\InventoryService;
use App\Services\NotificationService;
use App\Services\POSService;
use App\Services\ReportService;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Bind services to the container for dependency injection
        $this->app->singleton(InventoryService::class);
        $this->app->singleton(POSService::class);
        $this->app->singleton(DashboardService::class);
        $this->app->singleton(ReportService::class);
        $this->app->singleton(NotificationService::class);
    }
    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production')) {
        URL::forceScheme('https');
    }
    }
}
