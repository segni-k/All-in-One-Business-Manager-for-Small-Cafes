"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  Users,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useStaff } from "@/lib/hooks";
import { staff as staffApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { StaffMember, StaffPayload, StaffStatus } from "@/lib/types";

const ROLES = [
  { id: 1, value: "admin", label: "Admin" },
  { id: 2, value: "manager", label: "Manager" },
  { id: 3, value: "pos_staff", label: "POS Staff" },
] as const;

const STATUSES: { value: StaffStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function getRoleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label ?? role;
}

// ---- Staff Form Dialog ----
function StaffFormDialog({
  open,
  onClose,
  editingStaff,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editingStaff: StaffMember | null;
  onSuccess: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleId, setRoleId] = useState("3");
  const [status, setStatus] = useState<StaffStatus>("active");
  const [formError, setFormError] = useState("");

  const isEditing = !!editingStaff;

  // Populate form when editing
  useEffect(() => {
    if (editingStaff) {
      setName(editingStaff.name);
      setEmail(editingStaff.email);
      setPassword("");
      setRoleId(
        String(
          editingStaff.role_id ??
            ROLES.find((r) => r.value === editingStaff.role?.name)?.id ??
            3
        )
      );
      setStatus(editingStaff.status ?? "active");
    } else {
      setName("");
      setEmail("");
      setPassword("");
      setRoleId("3");
      setStatus("active");
    }
    setFormError("");
  }, [editingStaff]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !email.trim()) {
      setFormError("Name and email are required.");
      return;
    }
    if (!isEditing && !password) {
      setFormError("Password is required for new staff members.");
      return;
    }

    setSaving(true);
    try {
      const payload: StaffPayload = {
        name: name.trim(),
        email: email.trim(),
        role_id: Number(roleId),
        is_active: status === "active",
      };
      if (password) payload.password = password;

      if (isEditing) {
        await staffApi.update(editingStaff.id, payload);
        toast.success(`${name} updated successfully.`);
      } else {
        await staffApi.create(payload);
        toast.success(`${name} created successfully.`);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Operation failed. Please try again.";
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
          <DialogTitle>
            {isEditing ? "Edit Staff Member" : "Create Staff Member"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update details for ${editingStaff.name}.`
              : "Fill in the details to add a new team member."}
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
            <Label htmlFor="staff-name">Name</Label>
            <Input
              id="staff-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-email">Email</Label>
            <Input
              id="staff-email"
              type="email"
              placeholder="email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="staff-password">
              Password
              {isEditing && (
                <span className="ml-1 text-xs font-normal text-muted-foreground">
                  (leave blank to keep current)
                </span>
              )}
            </Label>
            <Input
              id="staff-password"
              type="password"
              placeholder={isEditing ? "Unchanged" : "Enter password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEditing}
              minLength={6}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Role</Label>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as StaffStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              {isEditing ? "Save Changes" : "Create Staff"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Table Skeleton ----
function StaffTableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-8 ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ---- Main Page ----
export default function StaffPage() {
  const { hasPermission } = useAuth();
  const { data, isLoading, error, mutate } = useStaff();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleting, setDeleting] = useState<StaffMember | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  if (!hasPermission("manage_staff")) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage staff.
        </p>
      </div>
    );
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await staffApi.delete(deleting.id);
      toast.success(`${deleting.name} has been removed.`);
      mutate();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete staff member.";
      toast.error(message);
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  }

  const staffList = data ?? [];

  const filteredStaff = searchQuery
    ? staffList.filter(
        (m) =>
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.role?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : staffList;

  const activeCount = staffList.filter((m) => m.status === "active").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage your team members, roles, and access.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Staff
        </Button>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription className="mt-1">
                {staffList.length} total &middot; {activeCount} active
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <StaffTableSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Failed to load staff data. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Retry
              </Button>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Users className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {searchQuery
                  ? "No staff members match your search."
                  : "No staff members yet. Create your first team member."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        {member.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getRoleLabel(member.role?.name ?? "")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            member.status === "active" ? "default" : "outline"
                          }
                          className={
                            member.status === "active"
                              ? "bg-success text-success-foreground"
                              : "text-muted-foreground"
                          }
                        >
                          {member.status === "active" ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Actions for ${member.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(member);
                                setFormOpen(true);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleting(member)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      {formOpen && (
        <StaffFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          editingStaff={editing}
          onSuccess={() => mutate()}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <strong>{deleting?.name}</strong> from your team? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
