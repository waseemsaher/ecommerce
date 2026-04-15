<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    // ── Helpers ────────────────────────────────────────────────────────────

    private function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'name'                  => 'Alice Example',
            'email'                 => 'alice@example.com',
            'password'              => 'secret123',
            'password_confirmation' => 'secret123',
        ], $overrides);
    }

    // ── Register ───────────────────────────────────────────────────────────

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', $this->registerPayload());

        $response->assertCreated()
                 ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

        $this->assertDatabaseHas('users', ['email' => 'alice@example.com']);
    }

    public function test_register_fails_with_duplicate_email(): void
    {
        User::factory()->create(['email' => 'alice@example.com']);

        $response = $this->postJson('/api/auth/register', $this->registerPayload());

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_register_fails_with_mismatched_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/register', $this->registerPayload([
            'password_confirmation' => 'different',
        ]));

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['password']);
    }

    // ── Login ──────────────────────────────────────────────────────────────

    public function test_user_can_login(): void
    {
        User::factory()->create([
            'email'    => 'alice@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'alice@example.com',
            'password' => 'secret123',
        ]);

        $response->assertOk()
                 ->assertJsonStructure(['token', 'user']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email'    => 'alice@example.com',
            'password' => bcrypt('secret123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email'    => 'alice@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['email']);
    }

    public function test_login_fails_with_unknown_email(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email'    => 'ghost@example.com',
            'password' => 'secret123',
        ]);

        $response->assertUnprocessable();
    }

    // ── Logout ─────────────────────────────────────────────────────────────

    public function test_user_can_logout(): void
{
    $user  = User::factory()->create();
    $token = $user->createToken('api-token')->plainTextToken;

    // First call — logout succeeds
    $this->withToken($token)
         ->postJson('/api/auth/logout')
         ->assertOk()
         ->assertJson(['message' => 'Logged out successfully.']);

    // Assert the token was actually deleted from the DB — this is the
    // correct way to verify revocation without a second HTTP call
    $this->assertDatabaseCount('personal_access_tokens', 0);
}
    public function test_logout_requires_authentication(): void
    {
        $this->postJson('/api/auth/logout')
             ->assertUnauthorized();
    }
}