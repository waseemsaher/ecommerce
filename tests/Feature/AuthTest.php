<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Notifications\ResetPassword;
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

    // ── Forgot Password ───────────────────────────────────────────────────

    public function test_forgot_password_sends_reset_link(): void
    {
        Notification::fake();

        $user = User::factory()->create(['email' => 'alice@example.com']);

        $response = $this->postJson('/api/auth/password/forgot', [
            'email' => 'alice@example.com',
        ]);

        $response->assertOk()
                 ->assertJson([
                     'message' => 'If an account with that email exists, a password reset link has been sent.',
                 ]);

        Notification::assertSentTo($user, ResetPassword::class);
    }

    public function test_forgot_password_returns_200_for_unknown_email(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/password/forgot', [
            'email' => 'nobody@example.com',
        ]);

        // Must still return 200 to prevent user enumeration
        $response->assertOk()
                 ->assertJson([
                     'message' => 'If an account with that email exists, a password reset link has been sent.',
                 ]);

        Notification::assertNothingSent();
    }

    public function test_forgot_password_requires_email(): void
    {
        $response = $this->postJson('/api/auth/password/forgot', []);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['email']);
    }

    // ── Reset Password ────────────────────────────────────────────────────

    public function test_password_can_be_reset_with_valid_token(): void
    {
        $user = User::factory()->create([
            'email'    => 'alice@example.com',
            'password' => Hash::make('old-password'),
        ]);

        // Generate a real reset token via the broker
        $token = Password::createToken($user);

        $response = $this->postJson('/api/auth/password/reset', [
            'token'                 => $token,
            'email'                 => 'alice@example.com',
            'password'              => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertOk()
                 ->assertJson(['message' => 'Password has been reset successfully.']);

        // Verify the password was actually changed
        $user->refresh();
        $this->assertTrue(Hash::check('new-password123', $user->password));
    }

    public function test_password_reset_fails_with_invalid_token(): void
    {
        User::factory()->create([
            'email'    => 'alice@example.com',
            'password' => Hash::make('old-password'),
        ]);

        $response = $this->postJson('/api/auth/password/reset', [
            'token'                 => 'invalid-token',
            'email'                 => 'alice@example.com',
            'password'              => 'new-password123',
            'password_confirmation' => 'new-password123',
        ]);

        $response->assertUnprocessable();
    }

    public function test_password_reset_requires_confirmation(): void
    {
        $response = $this->postJson('/api/auth/password/reset', [
            'token'    => 'some-token',
            'email'    => 'alice@example.com',
            'password' => 'new-password123',
        ]);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['password']);
    }

    public function test_password_reset_requires_all_fields(): void
    {
        $response = $this->postJson('/api/auth/password/reset', []);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors(['token', 'email', 'password']);
    }
}