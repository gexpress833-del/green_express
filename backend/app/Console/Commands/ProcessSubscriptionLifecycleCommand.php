<?php

namespace App\Console\Commands;

use App\Jobs\ProcessSubscriptionLifecycleJob;
use Illuminate\Console\Command;

class ProcessSubscriptionLifecycleCommand extends Command
{
    protected $signature = 'subscriptions:process-lifecycle';

    protected $description = 'Active les abonnements planifiés (scheduled→active) et marque expirés.';

    public function handle(): int
    {
        ProcessSubscriptionLifecycleJob::dispatchSync();

        $this->info('Cycle abonnements traité.');

        return self::SUCCESS;
    }
}
