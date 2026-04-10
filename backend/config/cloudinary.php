<?php

return [
    /**
     * Identifiants (dashboard Cloudinary → API Keys).
     * Alternative : une seule ligne CLOUDINARY_URL=cloudinary://key:secret@cloud_name
     */
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key' => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'url' => env('CLOUDINARY_URL'),

    'secure' => true,

    /**
     * Options par défaut fusionnées à chaque upload (SEO / perf).
     * @see https://cloudinary.com/documentation/image_upload_api_reference
     */
    'upload_defaults' => [
        'resource_type' => 'image',
        'quality' => 'auto',
        'fetch_format' => 'auto',
    ],

    /**
     * Alias API → dossier Cloudinary (préfixe green-express/).
     * Clés = valeurs acceptées par POST /api/upload-image (champ folder).
     */
    'folders' => [
        'menus' => 'green-express/menus',
        'promotions' => 'green-express/promotions',
        'uploads' => 'green-express/uploads',
        'profiles' => 'green-express/profiles',
        'subscription-plans' => 'green-express/subscription-plans',
        'green-express/menus' => 'green-express/menus',
        'green-express/promotions' => 'green-express/promotions',
        'green-express/uploads' => 'green-express/uploads',
        'green-express/profiles' => 'green-express/profiles',
        'green-express/subscription-plans' => 'green-express/subscription-plans',
    ],

    'max_file_size' => 5120,
    'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp'],

    /**
     * Tests PHPUnit uniquement : simule upload/suppression sans appeler l’API Cloudinary.
     * Jamais activé en production (phpunit.xml ou .env.testing).
     */
    'mock_uploads' => env('CLOUDINARY_MOCK_UPLOADS', false),
];
