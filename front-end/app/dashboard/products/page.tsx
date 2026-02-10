"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  RotateCcw,
  Search,
  Package,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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

import { useProducts, useCategories } from "@/lib/hooks";
import { products as productsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Product, ProductPayload } from "@/lib/types";

/* -------------------------------- Helpers -------------------------------- */

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getProductStatus(product: Product) {
  if (product.deleted_at) return "deleted";
  return product.is_active ? "active" : "inactive";
}

/* --------------------------- Product Form Dialog -------------------------- */

function ProductFormDialog({
  open,
  onClose,
  editingProduct,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editingProduct: Product | null;
  onSuccess: () => void;
}) {
  const isEditing = !!editingProduct;

  const { data: categories } = useCategories();

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategoryId(editingProduct.category?.id ?? null);
      setPrice(String(editingProduct.price));
      setCost(String(editingProduct.cost));
      setStock(String(editingProduct.stock));
      setIsActive(editingProduct.is_active);
    } else {
      setName("");
      setSku("");
      setCategoryId(null);
      setPrice("");
      setCost("");
      setStock("");
      setIsActive(true);
    }
    setFormError("");
  }, [editingProduct]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim() || !sku.trim()) {
      setFormError("Name and SKU are required.");
      return;
    }

    setSaving(true);
    try {
      const payload: ProductPayload = {
        name: name.trim(),
        sku: sku.trim(),
        category_id: categoryId,
        price: parseFloat(price),
        cost: parseFloat(cost),
        stock: parseInt(stock) || 0,
        is_active: isActive,
      };

      if (isEditing) {
        await productsApi.update(editingProduct!.id, payload);
        toast.success("Product updated.");
      } else {
        await productsApi.create(payload);
        toast.success("Product created.");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            Manage product information
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
            <Input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              value={categoryId?.toString() ?? ""}
              onValueChange={(v) => setCategoryId(v ? Number(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories?.data.map((cat) => (
                  <SelectItem key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={isActive ? "1" : "0"}
              onValueChange={(v) => setIsActive(v === "1")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Active</SelectItem>
                <SelectItem value="0">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Price" />
            <Input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="Cost" />
            <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------- Main Page ------------------------------- */

export default function ProductsPage() {
  const router = useRouter();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("manage_inventory");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, error, mutate } = useProducts({
    page,
    search: search || undefined,
    include_inactive: showInactive,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const productsList = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Products</h1>
        {canManage && (
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Product
          </Button>
        )}
      </div>

      <Card>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : error ? (
            <p className="text-destructive">Failed to load products</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsList.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.sku}</TableCell>
                    <TableCell>{p.category?.name ?? "—"}</TableCell>
                    <TableCell>
                      {p.is_active ? (
                        <Badge className="bg-green-600">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingProduct={editing}
        onSuccess={mutate}
      />
    </div>
  );
}
