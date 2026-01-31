<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function index(){
        return User::with('role')->get();
    }

    public function store(Request $request){
        $request->validate([
            'name'=>'required|string|max:255',
            'email'=>'required|string|email|unique:users',
            'password'=>'required|string|min:6',
            'role_id'=>'required|exists:staff_roles,id'
        ]);

        $user = User::create($request->only('name','email','password','role_id'));
        return response()->json($user,201);
    }

    public function update(Request $request, $id){
        $user = User::findOrFail($id);
        $request->validate([
            'name'=>'sometimes|string|max:255',
            'email'=>['sometimes','email',Rule::unique('users')->ignore($user->id)],
            'password'=>'sometimes|string|min:6',
            'role_id'=>'sometimes|exists:staff_roles,id'
        ]);

        $user->update($request->only('name','email','password','role_id'));
        return response()->json($user);
    }

    public function destroy($id){
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message'=>'Deleted']);
    }
}

