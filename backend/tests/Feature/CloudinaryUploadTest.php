<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CloudinaryUploadTest extends TestCase
{
    use RefreshDatabase;

    protected User $chef;

    protected function setUp(): void
    {
        parent::setUp();
        $this->chef = User::factory()->create([
            'role' => 'CHEF',
            'email' => 'chef@test.com',
        ]);
    }

    /**
     * Test: GET /api/upload/config returns Cloudinary configuration (authenticated with Sanctum)
     */
    public function test_get_upload_config()
    {
        $this->actingAs($this->chef, 'api')
            ->getJson('/api/upload/config')
            ->assertStatus(200)
            ->assertJsonStructure([
                'status',
                'cloud_name',
                'api_key',
                'message',
            ])
            ->assertJson([
                'status' => 'ok',
            ]);
    }

    /**
     * Test: POST /api/upload-image with valid image file (Sanctum session)
     */
    public function test_upload_image_success()
    {
        $file = UploadedFile::fake()->image('menu.jpg', 100, 100);

        $this->actingAs($this->chef, 'api')
            ->postJson('/api/upload-image', [
                'image' => $file,
                'folder' => 'menus',
            ])
            ->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'url',
                'message',
            ])
            ->assertJson(['success' => true]);
    }

    /**
     * Test: POST /api/upload-image without image returns 422
     */
    public function test_upload_image_missing_file()
    {
        $this->actingAs($this->chef, 'api')
            ->postJson('/api/upload-image', [])
            ->assertStatus(422)
            ->assertJsonStructure(['errors']);
    }

    /**
     * Test: POST /api/upload-image with invalid image type
     */
    public function test_upload_image_invalid_type()
    {
        $file = UploadedFile::fake()->create('document.txt', 100);

        $this->actingAs($this->chef, 'api')
            ->postJson('/api/upload-image', [
                'image' => $file,
            ])
            ->assertStatus(422);
    }

    /**
     * Test: GET /api/upload-image/transform?public_id=...
     */
    public function test_get_transformed_url()
    {
        $publicId = 'green-express/uploads/test_image';

        $this->actingAs($this->chef, 'api')
            ->getJson('/api/upload-image/transform?public_id=' . urlencode($publicId) . '&width=200&height=200&crop=fill')
            ->assertStatus(200)
            ->assertJsonStructure(['success', 'url']);
    }

    /**
     * Test: DELETE /api/upload-image with valid public_id
     */
    public function test_delete_image_success()
    {
        $this->actingAs($this->chef, 'api')
            ->deleteJson('/api/upload-image', [
                'public_id' => 'green-express/uploads/test_image',
            ])
            ->assertStatus(200)
            ->assertJsonStructure(['success', 'message']);
    }

    /**
     * Test: Unauthenticated request returns 401
     */
    public function test_upload_without_auth()
    {
        $file = UploadedFile::fake()->image('menu.jpg');

        $this->postJson('/api/upload-image', [
            'image' => $file,
        ])->assertStatus(401);
    }
}
