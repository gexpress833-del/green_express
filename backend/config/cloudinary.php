<?php

return [
    /**
     * Cloudinary SDK PHP v2 Configuration
     * Documentation: https://cloudinary.com/documentation/php_integration
     */
    
    'cloud_name' => env('CLOUDINARY_CLOUD_NAME'),
    'api_key' => env('CLOUDINARY_API_KEY'),
    'api_secret' => env('CLOUDINARY_API_SECRET'),
    'url' => env('CLOUDINARY_URL'),
    
    /**
     * Options secures par défaut
     */
    'secure' => true,
    'cdn_subdomain' => true,
    
    /**
     * Options par défaut lors des uploads
     */
    'upload_options' => [
        'resource_type' => 'auto',
        'quality' => 'auto',
        'fetch_format' => 'auto',
        'secure' => true,
    ],
    
    /**
     * Dossiers Cloudinary par catégorie
     */
    'folders' => [
        'menus' => 'green-express/menus',
        'promotions' => 'green-express/promotions',
        'uploads' => 'green-express/uploads',
        'profiles' => 'green-express/profiles',
    ],
    
    /**
     * Limites de fichiers
     */
    'max_file_size' => 5120, // 5MB en KB
    'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
];
