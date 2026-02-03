<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\StaffRole;
use App\Models\User;
use Illuminate\Http\Request;

class StaffController extends Controller
{

    /**
     * List all staff users with their roles and permissions
     */
    public function index()
    {
        return response()->json(
            User::with('role.permissions')->get(),
            200
        );
    }

    /**
     * Create a new staff user (admin-only)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:staff_roles,id'
        ]);

        $role = StaffRole::find($request->role_id);

        // Protect admin role from being assigned
        if ($role?->name === 'admin') {
            abort(403, 'Admin role is locked');
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
            'role_id' => $request->role_id
        ]);

        return response()->json(
            $user->load('role.permissions'),
            201
        );
    }

    /**
     * Update a staff user
     */
   public function update(Request $request, User $user)
{
    // Protect admin accounts
    if ($user->role?->name === 'admin') {
        abort(403, 'Admin account is protected');
    }

    $request->validate([
        'name' => 'sometimes|string|max:255',
        'email' => 'sometimes|email|unique:users,email,' . $user->id,
        'password' => 'sometimes|string|min:6',
        'role_id' => 'sometimes|exists:staff_roles,id',
        'is_active' => 'sometimes|boolean'
    ]);

    // Prevent assigning admin role
    if ($request->filled('role_id')) {
        $role = StaffRole::find($request->role_id);
        if (!$role) {
            abort(422, 'Role not found');
        }
        if ($role->name === 'admin') {
            abort(403, 'Cannot assign admin role');
        }
    }

    $data = $request->only('name', 'email', 'role_id', 'is_active');

    if ($request->filled('password')) {
        $data['password'] = bcrypt($request->password); // Hash password
    }

    $user->update($data); // <-- This saves the data

    // Return clean JSON
    return response()->json([
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'is_active' => $user->is_active,
        'role' => $user->role ? [
            'id' => $user->role->id,
            'name' => $user->role->name,
            'permissions' => $user->role->permissions->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name
            ])
        ] : null
    ], 200);
}
    /**
     * Delete a staff user
     */
    public function destroy(User $user)
    {
        // Protect admin accounts
        if ($user->role?->name === 'admin') {
            abort(403, 'Admin account is protected');
        }

        $user->delete();

        return response()->json(null, 204);
    }
}

