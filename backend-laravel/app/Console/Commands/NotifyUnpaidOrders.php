<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\NotificationService;
use Illuminate\Support\Facades\Log;

class NotifyUnpaidOrders extends Command
{
    protected $signature = 'notify:unpaid-orders';
    protected $description = 'Notify customers of unpaid orders';

    public function handle(NotificationService $notifications)
    {
        try {
            $notifications->notifyUnpaidOrders();
            $this->info('Unpaid order notifications sent successfully.');
            Log::info('NotifyUnpaidOrders: Notifications sent successfully.');
        } catch (\Exception $e) {
            $this->error('Failed to send unpaid order notifications.');
            Log::error('NotifyUnpaidOrders: ' . $e->getMessage());
        }
    }
}

