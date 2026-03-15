<?php

namespace App\Services;

use Cloudinary\Configuration\Configuration;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Api\Admin\AdminApi;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    private static ?UploadApi $uploadApi = null;
    private static ?AdminApi $adminApi = null;
    private static bool $initialized = false;

    private static function initialize(): void
    {
        if (self::$initialized) {
            return;
        }

        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if (!$cloudName || !$apiKey || !$apiSecret) {
            throw new \Exception('Cloudinary not configured in .env. Cloud: ' . ($cloudName ? 'OK' : 'MISSING') . ', Key: ' . ($apiKey ? 'OK' : 'MISSING') . ', Secret: ' . ($apiSecret ? 'OK' : 'MISSING'));
        }

        try {
            // Use the cloudinary:// URL format which is more reliable
            $cloudinaryUrl = "cloudinary://{$apiKey}:{$apiSecret}@{$cloudName}";
            Configuration::instance($cloudinaryUrl);
            
            self::$uploadApi = new UploadApi();
            self::$adminApi = new AdminApi();
            self::$initialized = true;

            Log::info('Cloudinary initialized successfully', [
                'cloud_name' => $cloudName,
                'api_key' => substr($apiKey, 0, 5) . '***',
            ]);
        } catch (\Exception $e) {
            Log::error('Cloudinary initialization failed: ' . $e->getMessage());
            throw $e;
        }
    }

    public static function checkConfiguration(): array
    {
        $cloudName = env('CLOUDINARY_CLOUD_NAME');
        $apiKey = env('CLOUDINARY_API_KEY');
        $apiSecret = env('CLOUDINARY_API_SECRET');

        if (!$cloudName || !$apiKey || !$apiSecret) {
            return [
                'status' => 'error',
                'message' => 'Cloudinary credentials not configured in .env file.',
            ];
        }

        return [
            'status' => 'ok',
            'cloud_name' => $cloudName,
            'api_key' => substr($apiKey, 0, 5) . '***',
            'message' => 'Cloudinary is properly configured',
        ];
    }

    /**
     * Upload an image and return an array with url and public_id.
     * For backward compatibility this method may return a string in older callers,
     * but we prefer returning an array: ['url' => ..., 'public_id' => ...]
     */
    public static function uploadImage(UploadedFile $file, string $folder = 'uploads')
    {
        self::initialize();

        $folderMap = [
            'menus' => 'green-express/menus',
            'promotions' => 'green-express/promotions',
            'uploads' => 'green-express/uploads',
            'profiles' => 'green-express/profiles',
            // Allow full paths as-is
            'green-express/menus' => 'green-express/menus',
            'green-express/promotions' => 'green-express/promotions',
            'green-express/uploads' => 'green-express/uploads',
            'green-express/profiles' => 'green-express/profiles',
        ];

        $result = self::$uploadApi->upload($file->getRealPath(), [
            'folder' => $folderMap[$folder] ?? $folderMap['uploads'],
            'public_id' => time() . '_' . uniqid(),
        ]);

        $url = $result['secure_url'] ?? ($result['url'] ?? '');
        $publicId = $result['public_id'] ?? null;

        return [
            'url' => $url,
            'public_id' => $publicId,
            'raw' => $result,
        ];
    }

    public static function deleteImage(string $publicId): bool
    {
        try {
            self::initialize();

            // Si c'est une URL, extraire le public_id
            if (filter_var($publicId, FILTER_VALIDATE_URL)) {
                $publicId = self::extractPublicId($publicId);
            }

            if (!$publicId) {
                Log::warning('Invalid public_id for deletion');
                return false;
            }

            // Cloudinary SDK expects just an array of public IDs, not in options array
            try {
                self::$adminApi->deleteAssets([$publicId]);
                Log::info('Cloudinary asset deleted: ' . $publicId);
                return true;
            } catch (\Exception $deleteEx) {
                // If failed, try without folder prefix (last part only)
                if (strpos($publicId, '/') !== false) {
                    $parts = explode('/', $publicId);
                    $simpleName = end($parts);
                    Log::info('Retry delete with simple name: ' . $simpleName);
                    self::$adminApi->deleteAssets([$simpleName]);
                    return true;
                }
                throw $deleteEx;
            }
        } catch (\Exception $e) {
            Log::error('Cloudinary delete error: ' . $e->getMessage(), [
                'public_id' => $publicId,
            ]);
            return false;
        }
    }

    public static function getTransformedUrl(string $publicId, array $transformations = []): string
    {
        try {
            $cloudName = env('CLOUDINARY_CLOUD_NAME');
            $baseUrl = 'https://res.cloudinary.com/' . $cloudName . '/image/upload';

            $transformStr = '';
            if (!empty($transformations)) {
                $parts = [];
                foreach ($transformations as $k => $v) {
                    $parts[] = $k . '_' . $v;
                }
                $transformStr = '/' . implode(',', $parts);
            }

            return $baseUrl . $transformStr . '/' . $publicId;
        } catch (\Exception $e) {
            Log::error('Cloudinary transform error: ' . $e->getMessage());
            return '';
        }
    }

    private static function extractPublicId(string $url): ?string
    {
        if (preg_match('/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/', $url, $matches)) {
            return rtrim($matches[1], '/');
        }
        return null;
    }

}
