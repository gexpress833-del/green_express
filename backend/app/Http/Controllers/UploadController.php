<?php

namespace App\Http\Controllers;

use App\Services\CloudinaryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class UploadController extends Controller
{
    /**
     * Tester la configuration Cloudinary
     * GET /api/upload/config
     */
    public function checkConfig(): JsonResponse
    {
        if (! request()->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $status = CloudinaryService::checkConfiguration();
            
            if ($status['status'] === 'error') {
                return response()->json($status, 500);
            }
            
            return response()->json($status, 200);
        } catch (\Exception $e) {
            Log::error('Cloudinary config check error: ' . $e->getMessage());
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload une image vers Cloudinary (ou stockage local en fallback)
     * POST /api/upload-image
     * Body: form-data avec clé 'image' (fichier) et optionnellement 'folder'
     */
    public function uploadImage(Request $request): JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $maxKb = (int) config('cloudinary.max_file_size', 5120);
            $allowedFolders = array_keys(config('cloudinary.folders', []));

            $request->validate([
                'image' => 'required|image|mimes:jpeg,png,jpg,webp|max:'.$maxKb,
                'folder' => ['sometimes', Rule::in($allowedFolders)],
            ]);

            $file = $request->file('image');
            $folder = $request->input('folder', 'uploads');

            // Tests automatisés : pas d’appel réseau Cloudinary
            if (app()->environment('testing') && config('cloudinary.mock_uploads')) {
                $folderResolved = CloudinaryService::resolveFolder($folder);
                $publicId = $folderResolved.'/test_'.uniqid('', true);

                return response()->json([
                    'success' => true,
                    'url' => 'https://res.cloudinary.com/'.(CloudinaryService::cloudName() ?? 'demo').'/image/upload/v1/'.$publicId.'.jpg',
                    'public_id' => $publicId,
                    'message' => 'Image uploadée avec succès',
                ], 200);
            }

            // Toutes les images sont stockées sur Cloudinary — pas de fallback local
            $cloudinaryStatus = CloudinaryService::checkConfiguration();
            if (($cloudinaryStatus['status'] ?? '') !== 'ok') {
                return response()->json([
                    'success' => false,
                    'message' => 'Cloudinary n\'est pas configuré. Ajoutez CLOUDINARY_URL ou CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET dans .env (voir .env.example).',
                ], 503);
            }

            $url = null;
            $publicId = null;
            try {
                $uploadResult = CloudinaryService::uploadImage($file, $folder);
                if (is_array($uploadResult)) {
                    $url = $uploadResult['url'] ?? null;
                    $publicId = $uploadResult['public_id'] ?? null;
                } else {
                    $url = (string) $uploadResult;
                }
            } catch (\Exception $cloudinaryError) {
                Log::warning('Cloudinary upload failed: ' . $cloudinaryError->getMessage());
                return response()->json([
                    'success' => false,
                    'message' => 'Échec de l\'upload vers Cloudinary. Vérifiez les clés dans .env et la connexion : ' . $cloudinaryError->getMessage(),
                ], 502);
            }

            $response = [
                'success' => true,
                'url' => $url,
                'message' => 'Image uploadée avec succès',
            ];
            if ($publicId) {
                $response['public_id'] = $publicId;
            }

            return response()->json($response, 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Image upload error: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id ?? null,
                'ip' => $request->ip(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'upload',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }

    /**
     * Supprimer une image de Cloudinary
     * DELETE /api/upload-image
     * Body: JSON avec clé 'public_id' ou 'url'
     */
    public function deleteImage(Request $request): JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $request->validate([
                'public_id' => 'required_without:url|string',
                'url' => 'required_without:public_id|url',
            ]);

            $publicId = $request->input('public_id') ?? $request->input('url');

            if (!$publicId) {
                return response()->json([
                    'success' => false,
                    'message' => 'public_id ou url obligatoire',
                ], 400);
            }

            if (app()->environment('testing') && config('cloudinary.mock_uploads')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Image supprimée avec succès',
                ], 200);
            }

            $deleted = CloudinaryService::deleteImage($publicId);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer l\'image',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'Image supprimée avec succès',
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Image delete error: ' . $e->getMessage(), [
                'public_id' => $request->input('public_id'),
                'url' => $request->input('url'),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }

    /**
     * Obtenir une URL transformée (redimensionner, crop, etc.)
     * GET /api/upload-image/transform
     * Query params: public_id, width, height, crop
     */
    public function getTransformed(Request $request): JsonResponse
    {
        if (! $request->user()) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        try {
            $request->validate([
                'public_id' => 'required|string',
                'width' => 'sometimes|integer|min:10|max:2000',
                'height' => 'sometimes|integer|min:10|max:2000',
                'crop' => 'sometimes|in:fill,scale,crop,thumb,fit',
            ]);

            $publicId = $request->input('public_id');
            $transformations = [];

            if ($request->has('width')) {
                $transformations['width'] = $request->input('width');
            }
            if ($request->has('height')) {
                $transformations['height'] = $request->input('height');
            }
            if ($request->has('crop')) {
                $transformations['crop'] = $request->input('crop');
            }

            $url = CloudinaryService::getTransformedUrl($publicId, $transformations);

            return response()->json([
                'success' => true,
                'url' => $url,
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Transform error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la transformation',
                'error' => config('app.debug') ? $e->getMessage() : 'Erreur interne',
            ], 500);
        }
    }
}
