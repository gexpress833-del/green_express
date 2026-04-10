<?php

namespace App\Services;

class QrService
{
    public static function generateDataUrl(string $payload): string
    {
        // Placeholder: in production use BaconQrCode or endroid/qr-code
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="100%" height="100%" fill="#eee"/></svg>';
        return 'data:image/svg+xml;utf8,' . rawurlencode($svg);
    }
}
