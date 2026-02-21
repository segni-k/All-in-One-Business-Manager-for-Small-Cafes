<?php

namespace Tests\Feature;

// use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    /**
     * A basic test example.
     */
    public function test_the_application_returns_health_payload_for_root_route(): void
    {
        $response = $this->get('/');

        $response->assertOk()
            ->assertJsonStructure(['message', 'health', 'api']);
    }
}
