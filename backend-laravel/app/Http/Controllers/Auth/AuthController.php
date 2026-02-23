<?php

namespace App\Http\Controllers\Auth;

use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        try {
            $user = User::where('email', $request->email)->first();
        } catch (QueryException $exception) {
            report($exception);
            return response()->json([
                'message' => 'Login failed due to a database configuration issue. Check DB_URL or DATABASE_URL and run migrations.',
            ], 500);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Invalid credentials']
            ]);
        }

        if (!$user->is_active) {
            abort(403, 'Account disabled');
        }

        try {
            $token = $user->createToken('auth')->plainTextToken;
        } catch (QueryException $exception) {
            report($exception);
            return response()->json([
                'message' => 'Login failed because access token storage is unavailable. Run migrations and try again.',
            ], 500);
        }

        /** @var \App\Models\User $user */
        return response()->json([
            'user' => $this->hydrateUserForResponse($user),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out']);
    }

    public function me(Request $request)
    {
        return $this->hydrateUserForResponse($request->user());
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $rules = [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password' => 'sometimes|string|min:6|confirmed',
        ];

        if (Schema::hasColumn('users', 'avatar_url')) {
            $rules['avatar_url'] = 'sometimes|nullable|url|max:2048';
        }

        $validated = $request->validate($rules);

        if (!empty($validated['password'])) {
            if (empty($validated['current_password']) || !Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['Current password is incorrect.'],
                ]);
            }
        }

        $updateData = [];
        foreach (['name', 'email', 'avatar_url', 'password'] as $field) {
            if (array_key_exists($field, $validated)) {
                $updateData[$field] = $validated[$field];
            }
        }

        $user->update($updateData);

        return response()->json([
            'message' => 'Profile updated successfully',
            'user' => $this->hydrateUserForResponse($user->fresh()),
        ]);
    }

    private function hydrateUserForResponse(User $user): User
    {
        if (!Schema::hasTable('staff_roles')) {
            return $user;
        }

        $relations = ['role'];

        if (Schema::hasTable('permissions') && Schema::hasTable('role_permission')) {
            $relations[] = 'role.permissions';
        }

        return $user->loadMissing($relations);
    }
}
