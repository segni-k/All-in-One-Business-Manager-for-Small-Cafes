<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Services\NotificationService;
use Illuminate\Database\QueryException;
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

        try {
            $user = $request->user();
            $notifications = $this->notificationService->latest($limit);
            $readMap = $user->seenNotifications()
                ->pluck('notification_user_reads.read_at', 'notifications.id');
        } catch (QueryException $exception) {
            report($exception);
            return response()->json([
                'message' => 'Notifications are temporarily unavailable. Run migrations and verify database tables.',
                'data' => [],
                'unseen_count' => 0,
            ], 503);
        }

        $data = $notifications->map(function ($notification) use ($readMap) {
            $message = $notification->message;
            if (! is_string($message)) {
                $message = json_encode($message, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: (string) $message;
            }

            return [
                'id' => $notification->id,
                'type' => $notification->type,
                'message' => $message,
                'data' => null,
                'read_at' => $readMap->get($notification->id),
                'created_at' => $notification->created_at,
                'updated_at' => $notification->updated_at,
            ];
        });

        try {
            $unseenCount = Notification::query()
                ->whereDoesntHave('seenByUsers', function ($query) use ($user) {
                    $query->where('users.id', $user->id);
                })
                ->count();
        } catch (QueryException $exception) {
            report($exception);
            $unseenCount = 0;
        }

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
        try {
            $user = $request->user();
            $notification = Notification::query()->findOrFail($id);

            $user->seenNotifications()->syncWithoutDetaching([
                $notification->id => ['read_at' => now()],
            ]);

            $freshRead = $user->seenNotifications()
                ->where('notifications.id', $notification->id)
                ->first();
        } catch (QueryException $exception) {
            report($exception);
            return response()->json([
                'message' => 'Unable to update notifications because required database tables are missing.',
            ], 503);
        }

        return response()->json([
            'message' => 'Notification marked as seen',
            'data' => [
                'id' => $notification->id,
                'read_at' => $freshRead?->pivot?->read_at,
            ],
        ], 200);
    }
}
