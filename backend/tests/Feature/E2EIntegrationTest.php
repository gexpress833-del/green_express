<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class E2EIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    public function setUp(): void
    {
        parent::setUp();
        
        // Créer un utilisateur admin de test (pour éviter les restrictions de policy)
        $this->user = User::factory()->create([
            'email' => 'cuisinier@test.com',
            'password' => bcrypt('password'),
            'role' => 'admin',  // Admin pour contourner les policies
        ]);
    }

    /** @test */
    public function test_complete_e2e_flow_menu_with_image()
    {
        /**
         * TEST 1: Authentication (Sanctum session-based)
         */
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'cuisinier@test.com',
            'password' => 'password',
        ]);
        
        $loginResponse->assertStatus(200)
                     ->assertJsonStructure(['user']);
        
        echo "\n✓ [1] Login successful with Sanctum session\n";

        /**
         * TEST 2: Check Cloudinary Config (authenticated via Sanctum session)
         */
        // Utiliser actingAs pour les requêtes suivantes
        $configResponse = $this->actingAs($this->user)
                              ->getJson('/api/upload/config');
        
        $configResponse->assertStatus(200)
                      ->assertJsonStructure(['cloud_name', 'api_key']);
        
        echo "✓ [2] Cloudinary config received - Cloud: " . $configResponse['cloud_name'] . "\n";

        /**
         * TEST 3: Upload Image to Cloudinary
         */
        // Créer une image temporaire
        $imagePath = storage_path('test_image_' . time() . '.jpg');
        
        // Créer une vrai image JPEG (10x10 pixels, red)
        $image = imagecreatetruecolor(10, 10);
        $red = imagecolorallocate($image, 255, 0, 0);
        imagefill($image, 0, 0, $red);
        imagejpeg($image, $imagePath, 85);
        imagedestroy($image);
        
        $uploadFile = new UploadedFile(
            $imagePath,
            'test_image.jpg',
            'image/jpeg',
            null,
            true
        );
        
        $uploadResponse = $this->actingAs($this->user)
                              ->postJson('/api/upload-image', [
                                  'image' => $uploadFile,
                                  'folder' => 'menus',
                              ]);
        
        $uploadResponse->assertStatus(200)
                      ->assertJsonStructure(['url', 'success']);
        
        $imageUrl = $uploadResponse['url'];
        echo "✓ [3] Image uploaded - URL: " . substr($imageUrl, 0, 60) . "...\n";
        
        // Nettoyer
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }

        /**
         * TEST 4: Create Menu with Image
         */
        $menuResponse = $this->actingAs($this->user)
                            ->postJson('/api/menus', [
                                'title' => 'Test Menu E2E',
                                'description' => 'Menu créé par test E2E complet',
                                'price' => 1500.00,
                                'currency' => 'USD',
                                'image' => $imageUrl,
                            ]);
        
        $menuResponse->assertStatus(201)
                    ->assertJsonStructure(['id', 'title', 'price', 'image']);
        
        $menuId = $menuResponse['id'];
        echo "✓ [4] Menu created - ID: {$menuId}\n";

        /**
         * TEST 5: Verify Menu was Created in Database
         */
        $this->assertDatabaseHas('menus', [
            'id' => $menuId,
            'title' => 'Test Menu E2E',
            'image' => $imageUrl,
            'created_by' => $this->user->id,
        ]);
        
        echo "✓ [5] Menu verified in database\n";

        /**
         * TEST 6: Retrieve Menu Details
         */
        $detailResponse = $this->actingAs($this->user)
                              ->getJson("/api/menus/{$menuId}");
        
        $detailResponse->assertStatus(200)
                      ->assertJson([
                          'id' => $menuId,
                          'title' => 'Test Menu E2E',
                      ]);
        
        echo "✓ [6] Menu details retrieved\n";

        echo "\n✅ ALL E2E TESTS PASSED!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
