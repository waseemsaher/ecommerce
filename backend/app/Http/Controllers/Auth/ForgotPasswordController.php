<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Password;

class ForgotPasswordController extends Controller
{
    public function __invoke(ForgotPasswordRequest $request): JsonResponse
    {
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Always return 200 regardless of whether the email exists.
        // This prevents user-enumeration attacks.
        return response()->json([
            'message' => 'If an account with that email exists, a password reset link has been sent.',
        ], 200);
    }
}
