<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
        // Permission middleware applied in routes
    }

    /**
     * GET /api/notifications
     * Return latest notifications with per-user read status.
     */
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 50);
        $limit = max(1, min($limit, 200));

        $user = $request->user();
        $notifications = $this->notificationService->latest($limit);

        $readMap = $user->seenNotifications()
            ->pluck('notification_user_reads.read_at', 'notifications.id');

        $data = $notifications->map(function ($notification) use ($readMap) {
            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'message' => $notification->message,
                'data' => null,
                'read_at' => $readMap->get($notification->id),
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
            ];
        });

        $unseenCount = Notification::query()
            ->whereDoesntHave('seenByUsers', function ($query) use ($user) {
                $query->where('users.id', $user->id);
            })
            ->count();

        return response()->json([
            'data' => $data,
            'unseen_count' => $unseenCount,
        ], 200);
    }

    /**
     * Mark one notification as seen for authenticated user only.
     */
    public function markSeen(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        $notification = Notification::query()->findOrFail($id);

        $user->seenNotifications()->syncWithoutDetaching([
            $notification->id => ['read_at' => now()],
        ]);

        $freshRead = $user->seenNotifications()
            ->where('notifications.id', $notification->id)
            ->first();

        return response()->json([
            'message' => 'Notification marked as seen',
            'data' => [
                'id' => $notification->id,
                'read_at' => $freshRead?->pivot?->read_at,
            ],
        ], 200);
    }
}
