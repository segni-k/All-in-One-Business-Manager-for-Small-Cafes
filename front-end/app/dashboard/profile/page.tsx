"use client";

import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Shield,
  Key,
  Pencil,
  Loader2,
  AlertTriangle,
  CheckCircle,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import * as api from "@/lib/api";

async function updateProfileSafe(data: {
  name?: string;
  email?: string;
  avatar_url?: string | null;
  current_password?: string;
  password?: string;
  password_confirmation?: string;
}) {
  const profileModule = (api as {
    profile?: {
      update?: (payload: typeof data) => Promise<unknown>;
    };
  }).profile;

  if (profileModule?.update) {
    return profileModule.update(data);
  }

  const baseUrl = api.getApiUrl();
  if (!baseUrl) {
    throw new Error("API URL not set");
  }

  const token = typeof window === "undefined" ? null : localStorage.getItem("auth_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/me`, {
    method: "PUT",
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || "Failed to update profile");
  }

  return response.json().catch(() => null);
}

function getRoleLabel(role: string) {
  switch (role) {
    case "admin":
      return "Admin";
    case "manager":
      return "Manager";
    case "pos_staff":
      return "POS Staff";
    default:
      return role;
  }
}

function getRoleBadgeColor(role: string) {
  switch (role) {
    case "admin":
      return "bg-primary text-primary-foreground";
    case "manager":
      return "bg-chart-2 text-card";
    case "pos_staff":
      return "bg-secondary text-secondary-foreground";
    default:
      return "";
  }
}

function getPermissionLabel(perm: string) {
  switch (perm) {
    case "manage_staff":
      return "Manage Staff";
    case "use_pos":
      return "Use POS";
    case "manage_inventory":
      return "Manage Inventory";
    case "view_reports":
      return "View Reports";
    case "refund_order":
      return "Refund Orders";
    default:
      return perm.replace(/_/g, " ");
  }
}

function EditProfileDialog({
  open,
  onClose,
  currentName,
  currentEmail,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  currentName: string;
  currentEmail: string;
  onSuccess: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setName(currentName);
    setEmail(currentEmail);
    setPassword("");
    setPasswordConfirm("");
    setCurrentPassword("");
    setFormError("");
  }, [currentName, currentEmail, open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }

    if ((password || passwordConfirm) && password !== passwordConfirm) {
      setFormError("New password and confirmation do not match.");
      return;
    }

    if (password && !currentPassword) {
      setFormError("Current password is required to change password.");
      return;
    }

    setSaving(true);
    try {
      const payload: {
        name?: string;
        email?: string;
        current_password?: string;
        password?: string;
        password_confirmation?: string;
      } = {};

      if (name.trim() !== currentName) payload.name = name.trim();
      if (email.trim() !== currentEmail) payload.email = email.trim();
      if (password) {
        payload.current_password = currentPassword;
        payload.password = password;
        payload.password_confirmation = passwordConfirm;
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await updateProfileSafe(payload);
      await onSuccess();
      toast.success("Profile updated successfully.");
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update profile. Please try again.";
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your personal info and password.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-name">Name</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-email">Email</Label>
            <Input
              id="profile-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Separator />

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-current-password">Current Password</Label>
            <Input
              id="profile-current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-new-password">New Password</Label>
              <Input
                id="profile-new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="profile-new-password-confirm">Confirm Password</Label>
              <Input
                id="profile-new-password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                minLength={6}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [editOpen, setEditOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const initials = useMemo(
    () =>
      (user?.name || "User")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    [user?.name]
  );

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await refreshUser();
      toast.success("Profile refreshed.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to refresh profile.");
    } finally {
      setRefreshing(false);
    }
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <UserIcon className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          Unable to load profile. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <UserIcon className="h-6 w-6" />
            My Profile
          </h1>
          <p className="text-muted-foreground">
            View and manage your personal information.
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          {refreshing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatar_url ?? undefined} alt={user.name} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge className={getRoleBadgeColor(user.role.name)}>
              {getRoleLabel(user.role.name)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full bg-transparent"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>Your personal information and account settings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Full Name
                  </span>
                  <span className="text-sm font-medium">{user.name}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="text-sm font-medium">{user.email}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Role
                  </span>
                  <span className="text-sm font-medium">{getRoleLabel(user.role.name)}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Avatar
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {user.avatar_url ? "Selected avatar" : "No avatar selected"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions
              </CardTitle>
              <CardDescription>Your access rights within the application.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.role.name === "admin" ? (
                <div className="flex items-center gap-2 rounded-md bg-success/10 p-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">
                    As an Admin, you have full access to all features.
                  </span>
                </div>
              ) : user.role.permissions && user.role.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.role.permissions.map((perm) => (
                    <Badge
                      key={perm.id}
                      variant="outline"
                      className="flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <Key className="h-3 w-3" />
                      {getPermissionLabel(perm.name)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific permissions assigned. Contact an administrator.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {editOpen && (
        <EditProfileDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          currentName={user.name}
          currentEmail={user.email}
          onSuccess={refreshUser}
        />
      )}
    </div>
  );
}
