"use client";

import React, { useState, useEffect } from "react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/lib/auth-context";
import { profile as profileApi } from "@/lib/api";

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
    default:
      return perm.replace(/_/g, " ");
  }
}

// ---- Edit Profile Dialog ----
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
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setName(currentName);
    setEmail(currentEmail);
    setPassword("");
    setCurrentPassword("");
    setFormError("");
  }, [currentName, currentEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
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
        password?: string;
        current_password?: string;
      } = {};

      if (name.trim() !== currentName) payload.name = name.trim();
      if (email.trim() !== currentEmail) payload.email = email.trim();
      if (password) {
        payload.password = password;
        payload.current_password = currentPassword;
      }

      if (Object.keys(payload).length === 0) {
        onClose();
        return;
      }

      await profileApi.update(payload);
      toast.success("Profile updated successfully.");
      onSuccess();
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
            Update your personal information.
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
              placeholder="Full name"
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
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <Separator />

          <p className="text-sm text-muted-foreground">
            Leave password fields blank to keep your current password.
          </p>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-current-password">Current Password</Label>
            <Input
              id="profile-current-password"
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="profile-new-password">New Password</Label>
            <Input
              id="profile-new-password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
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

// ---- Main Profile Page ----
export default function ProfilePage() {
  const { user } = useAuth();
  const [editOpen, setEditOpen] = useState(false);

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

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserIcon className="h-6 w-6" />
          My Profile
        </h1>
        <p className="text-muted-foreground">
          View and manage your personal information.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-lg font-semibold">{user.name}</h2>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge className={getRoleBadgeColor(user.role)}>
              {getRoleLabel(user.role)}
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

        {/* Details Cards */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Account Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Account Details
              </CardTitle>
              <CardDescription>
                Your personal information and account settings.
              </CardDescription>
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
                  <span className="text-sm font-medium">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Member Since
                  </span>
                  <span className="text-sm font-medium">
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Permissions
              </CardTitle>
              <CardDescription>
                Your access rights within the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user.role === "admin" ? (
                <div className="flex items-center gap-2 rounded-md bg-success/10 p-3">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <span className="text-sm text-success">
                    As an Admin, you have full access to all features.
                  </span>
                </div>
              ) : user.permissions && user.permissions.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {user.permissions.map((perm) => (
                    <Badge
                      key={perm}
                      variant="outline"
                      className="flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <Key className="h-3 w-3" />
                      {getPermissionLabel(perm)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No specific permissions assigned. Contact an administrator to
                  request access.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Security Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Security
              </CardTitle>
              <CardDescription>
                Manage your password and account security.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-md border p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Password</span>
                  <span className="text-xs text-muted-foreground">
                    Last updated:{" "}
                    {new Date(user.updated_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      {editOpen && (
        <EditProfileDialog
          open={editOpen}
          onClose={() => setEditOpen(false)}
          currentName={user.name}
          currentEmail={user.email}
          onSuccess={() => {
            // Reload user data -- simplest approach: reload the page
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
