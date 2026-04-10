<?php

namespace App\Services;

use Cloudinary\Api\Admin\AdminApi;
use Cloudinary\Api\Upload\UploadApi;
use Cloudinary\Configuration\Configuration;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

class CloudinaryService
{
    private static ?UploadApi $uploadApi = null;

    private static ?AdminApi $adminApi = null;

    private static bool $initialized = false;

    /**
     * Nom du cloud (pour URLs manuelles) même si seul CLOUDINARY_URL est défini.
     */
    public static function cloudName(): ?string
    {
        $name = config('cloudinary.cloud_name');
        if ($name) {
            return $name;
        }
        $url = config('cloudinary.url');
        if ($url && preg_match('/@([a-z0-9_-]+)\s*$/i', $url, $m)) {
            return $m[1];
        }

        return null;
    }

    private static function initialize(): void
    {
        if (self::$initialized) {
            return;
        }

        $url = config('cloudinary.url');
        if (is_string($url) && $url !== '') {
            try {
                Configuration::instance($url);
                self::$uploadApi = new UploadApi;
                self::$adminApi = new AdminApi;
                self::$initialized = true;
                Log::debug('Cloudinary initialisé via CLOUDINARY_URL');

                return;
            } catch (\Throwable $e) {
                Log::warning('CLOUDINARY_URL invalide, fallback sur clés séparées : '.$e->getMessage());
            }
        }

        $cloudName = config('cloudinary.cloud_name');
        $apiKey = config('cloudinary.api_key');
        $apiSecret = config('cloudinary.api_secret');

        if (! $cloudName || ! $apiKey || ! $apiSecret) {
            throw new \Exception(
                'Cloudinary non configuré. Définissez CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET (voir .env.example).'
            );
        }

        try {
            $cloudinaryUrl = "cloudinary://{$apiKey}:{$apiSecret}@{$cloudName}";
            Configuration::instance($cloudinaryUrl);

            self::$uploadApi = new UploadApi;
            self::$adminApi = new AdminApi;
            self::$initialized = true;

            Log::info('Cloudinary initialisé', [
                'cloud_name' => $cloudName,
                'api_key' => substr($apiKey, 0, 5).'***',
            ]);
        } catch (\Exception $e) {
            Log::error('Échec init Cloudinary : '.$e->getMessage());
            throw $e;
        }
    }

    public static function checkConfiguration(): array
    {
        if (app()->environment('testing') && config('cloudinary.mock_uploads')) {
            $cloudName = config('cloudinary.cloud_name') ?: 'demo';
            $apiKey = config('cloudinary.api_key') ?: 'test';

            return [
                'status' => 'ok',
                'cloud_name' => $cloudName,
                'api_key' => $apiKey ? substr((string) $apiKey, 0, 5).'***' : '***',
                'message' => 'Cloudinary est configuré (mode test / mock)',
            ];
        }

        $url = config('cloudinary.url');
        $hasUrl = is_string($url) && $url !== '';

        $cloudName = config('cloudinary.cloud_name');
        $apiKey = config('cloudinary.api_key');
        $apiSecret = config('cloudinary.api_secret');
        $hasTriple = $cloudName && $apiKey && $apiSecret;

        if (! $hasUrl && ! $hasTriple) {
            return [
                'status' => 'error',
                'message' => 'Cloudinary : renseignez CLOUDINARY_URL ou les trois variables CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.',
            ];
        }

        return [
            'status' => 'ok',
            'cloud_name' => self::cloudName() ?? $cloudName,
            'api_key' => $apiKey ? substr($apiKey, 0, 5).'***' : '(via URL)',
            'message' => 'Cloudinary est configuré',
        ];
    }

    /**
     * Dossier Cloudinary effectif pour un alias (menus, uploads, …).
     */
    public static function resolveFolder(string $folderAlias): string
    {
        $map = config('cloudinary.folders', []);

        return $map[$folderAlias] ?? $map['uploads'] ?? 'green-express/uploads';
    }

    /**
     * @return array{url: string, public_id: ?string, raw: mixed}
     */
    public static function uploadImage(UploadedFile $file, string $folder = 'uploads'): array
    {
        self::initialize();

        $targetFolder = self::resolveFolder($folder);

        $options = array_merge(
            config('cloudinary.upload_defaults', []),
            [
                'folder' => $targetFolder,
                'public_id' => time().'_'.uniqid('', true),
            ]
        );

        $result = self::$uploadApi->upload($file->getRealPath(), $options);

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
        $resolved = $publicId;

        try {
            self::initialize();

            if (filter_var($resolved, FILTER_VALIDATE_URL)) {
                $resolved = self::extractPublicId($resolved) ?? '';
            }

            if ($resolved === '') {
                Log::warning('public_id Cloudinary invalide pour suppression');

                return false;
            }

            try {
                self::$adminApi->deleteAssets([$resolved]);
                Log::info('Cloudinary : asset supprimé', ['public_id' => $resolved]);

                return true;
            } catch (\Exception $deleteEx) {
                if (str_contains($resolved, '/')) {
                    $simpleName = basename($resolved);
                    self::$adminApi->deleteAssets([$simpleName]);

                    return true;
                }
                throw $deleteEx;
            }
        } catch (\Exception $e) {
            Log::error('Cloudinary delete : '.$e->getMessage(), ['public_id' => $resolved]);

            return false;
        }
    }

    public static function getTransformedUrl(string $publicId, array $transformations = []): string
    {
        try {
            $cloud = self::cloudName();
            if (! $cloud) {
                return '';
            }

            $baseUrl = 'https://res.cloudinary.com/'.$cloud.'/image/upload';

            $transformStr = '';
            if (! empty($transformations)) {
                $parts = [];
                foreach ($transformations as $k => $v) {
                    $parts[] = $k.'_'.$v;
                }
                $transformStr = '/'.implode(',', $parts);
            }

            return $baseUrl.$transformStr.'/'.$publicId;
        } catch (\Exception $e) {
            Log::error('Cloudinary transform : '.$e->getMessage());

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
