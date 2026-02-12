"use client";

import {
  Bell,
  AlertTriangle,
  Package,
  ShoppingCart,
  Info,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/lib/hooks";
import { notifications as notificationsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

function getNotificationIcon(type: string) {
  if (type.includes("stock") || type.includes("inventory")) {
    return <Package className="h-5 w-5 text-warning" />;
  }
  if (type.includes("order") || type.includes("payment")) {
    return <ShoppingCart className="h-5 w-5 text-primary" />;
  }
  if (type.includes("alert") || type.includes("warning")) {
    return <AlertTriangle className="h-5 w-5 text-destructive" />;
  }
  return <Info className="h-5 w-5 text-muted-foreground" />;
}

function getNotificationBadge(type: string) {
  if (type.includes("stock")) return "Low Stock";
  if (type.includes("order")) return "Order";
  if (type.includes("payment")) return "Payment";
  return type.replace(/_/g, " ");
}

export default function NotificationsPage() {
  const { hasPermission } = useAuth();
  const canUsePos = hasPermission("use_pos");
  const { data, isLoading, error, mutate } = useNotifications({
    enabled: canUsePos,
  });
  const notifications = data?.data ?? [];
  const unseenCount = data?.unseen_count ?? 0;

  if (!canUsePos) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view notifications.
        </p>
      </div>
    );
  }

  async function markSeen(id: number, readAt: string | null) {
    if (readAt) return;
    try {
      await notificationsApi.markSeen(id);
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update notification.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unseenCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground">
                {unseenCount} new
              </Badge>
            )}
          </h1>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
        <p className="text-muted-foreground">
          Stay updated with low stock alerts, unpaid orders, and other
          important events.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
          <CardDescription>
            {notifications.length} notification
            {notifications.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48 mb-1" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Failed to load notifications."}
              </p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Retry
              </Button>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No notifications yet. You're all caught up.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => markSeen(notification.id, notification.read_at)}
                  className={`flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/50 ${
                    !notification.read_at ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge variant="outline" className="text-xs">
                        {getNotificationBadge(notification.type)}
                      </Badge>
                      {!notification.read_at && (
                        <span className="h-2 w-2 rounded-full bg-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(
                        new Date(notification.created_at),
                        "MMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

