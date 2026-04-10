<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        // Évite les échecs CI / local sans vraies clés Cloudinary : mocks cohérents avec phpunit.xml
        if ($this->app->environment('testing')) {
            config([
                'cloudinary.mock_uploads' => true,
                'cloudinary.cloud_name' => config('cloudinary.cloud_name') ?: 'demo',
                'cloudinary.api_key' => config('cloudinary.api_key') ?: '123456789012345',
                'cloudinary.api_secret' => config('cloudinary.api_secret') ?: 'abcdefghijklmnopqrstuvwxyz123456789012',
            ]);
        }
    }
}
