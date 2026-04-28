<?php

namespace App\Console\Commands;

use App\Services\BeamsService;
use Illuminate\Console\Command;

class TestBeamsNotification extends Command
{
    protected $signature = 'beams:test 
                            {interest=hello : Intérêt cible (hello, admins, livreurs, ou user ID)}
                            {--title=Test Green Express : Titre de la notification}
                            {--body=Ceci est une notification de test : Corps de la notification}';

    protected $description = 'Envoie une notification push de test via Pusher Beams';

    public function handle(BeamsService $beams): int
    {
        $interest = $this->argument('interest');
        $title = $this->option('title');
        $body = $this->option('body');

        $instanceId = config('beams.instance_id');
        $secretKey = config('beams.secret_key');

        if (empty($instanceId) || empty($secretKey)) {
            $this->error('PUSHER_BEAMS_INSTANCE_ID et PUSHER_BEAMS_SECRET_KEY doivent être configurés dans .env');
            $this->line('Instance ID actuel : ' . ($instanceId ?: 'NON CONFIGURÉ'));
            $this->line('Secret Key actuel : ' . ($secretKey ? 'CONFIGURÉ' : 'NON CONFIGURÉ'));
            return self::FAILURE;
        }

        $this->info("Envoi d'une notification Beams à l'intérêt : {$interest}");
        $this->info("Titre : {$title}");
        $this->info("Corps : {$body}");

        $beams->sendToInterests([$interest], [
            'title' => $title,
            'body' => $body,
            'deep_link' => '/',
        ]);

        $this->info('Notification envoyée avec succès !');
        $this->line('');
        $this->line('Assurez-vous que :');
        $this->line('1. Le frontend est ouvert et le service worker enregistré');
        $this->line('2. L\'utilisateur a accepté les notifications navigateur');
        $this->line('3. L\'intérêt ' . $interest . ' est abonné côté client');

        return self::SUCCESS;
    }
}
