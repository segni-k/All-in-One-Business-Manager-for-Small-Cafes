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
import { useCategories, useProducts } from "@/lib/hooks";
import { products as productsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Product, ProductPayload, ProductStatus } from "@/lib/types";

// ---- Helpers ----
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getProductStatus(product: Product): string {
  if (product.deleted_at) return "deleted";
  return product.is_active ? "active" : "inactive";
}

// ---- Product Form Dialog ----
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
  const {
    data: categories,
    isLoading: categoriesLoading,
    mutate: mutateCategories,
  } = useCategories();
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState<ProductStatus>("active");

  // Populate form when editing
  useEffect(() => {
    if (editingProduct) {
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategoryId(
        typeof editingProduct.category === "object"
          ? editingProduct.category?.id
          : undefined
      );
      setPrice(String(editingProduct.price));
      setCost(String(editingProduct.cost));
      setStock(String(editingProduct.stock));
      setStatus(editingProduct.is_active ? "active" : "inactive");
    } else {
      setName("");
      setSku("");
      setCategoryId(undefined);
      setPrice("");
      setCost("");
      setStock("");
      setStatus("active");
    }
    setFormError("");
  }, [editingProduct]);

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();

    if (!newCategoryName.trim()) {
      toast.error("Category name is required.");
      return;
    }

    setCreatingCategory(true);
    try {
      const res = await productsApi.createCategory({ name: newCategoryName.trim() });
      await mutateCategories();
      setCategoryId(res.data.id);
      setNewCategoryName("");
      setCategoryDialogOpen(false);
      toast.success("Category created successfully.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create category.";
      toast.error(message);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!name.trim() || !sku.trim()) {
      setFormError("Name and SKU are required.");
      return;
    }
    if (!price || Number(price) < 0) {
      setFormError("Price must be a valid positive number.");
      return;
    }
    if (!cost || Number(cost) < 0) {
      setFormError("Cost must be a valid positive number.");
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
        is_active: status === "active",
      };

      if (isEditing) {
        await productsApi.update(editingProduct!.id, payload);
        toast.success(`${name} updated successfully.`);
      } else {
        await productsApi.create(payload);
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Product" : "Create Product"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Update details for ${editingProduct?.name}.`
              : "Fill in the details to add a new product."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-name">Name</Label>
              <Input
                id="prod-name"
                placeholder="Product name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-sku">SKU</Label>
              <Input
                id="prod-sku"
                placeholder="e.g. PROD-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setCategoryDialogOpen(true)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Create Category
                </Button>
              </div>
              <Select
                value={categoryId ? String(categoryId) : "none"}
                onValueChange={(value) =>
                  setCategoryId(value === "none" ? undefined : Number(value))
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={categoriesLoading ? "Loading..." : "Select category"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorized</SelectItem>
                  {(categories ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={String(cat.id)}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProductStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-price">Price</Label>
              <Input
                id="prod-price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="prod-cost">Cost</Label>
              <Input
                id="prod-cost"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="prod-stock">Stock</Label>
            <Input
              id="prod-stock"
              type="number"
              min="0"
              placeholder="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
            <DialogDescription>
              Add a new category to use for products.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-category-name">Category Name</Label>
              <Input
                id="new-category-name"
                placeholder="e.g. Beverages"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryDialogOpen(false)}
                disabled={creatingCategory}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={creatingCategory}>
                {creatingCategory && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

// ---- Table Skeleton ----
function ProductsTableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-8 ml-auto" />
        </div>
      ))}
    </div>
  );
}

// ---- Main Page ----
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
    include_inactive: showInactive ,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setSearch(searchInput);
      setPage(1);
    },
    [searchInput]
  );

  async function handleDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await productsApi.delete(deleting.id);
      toast.success(`${deleting.name} has been deleted.`);
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product.");
    } finally {
      setDeleteLoading(false);
      setDeleting(null);
    }
  }

  async function handleRestore(product: Product) {
    setRestoringId(product.id);
    try {
      await productsApi.restore(product.id);
      toast.success(`${product.name} has been restored.`);
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to restore product.");
    } finally {
      setRestoringId(null);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await mutate();
      router.refresh();
      toast.success("Products refreshed.");
    } catch {
      toast.error("Failed to refresh products.");
    } finally {
      setRefreshing(false);
    }
  }

  const productsList = data?.data ?? [];
  const totalPages = data?.last_page ?? 1;
  const totalProducts = data?.total ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            {canManage
              ? "Manage your product catalog and inventory."
              : "Browse the product catalog."}
          </p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Product
            </Button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-64 pl-9"
            />
          </div>
          <Button type="submit" variant="secondary" size="default">
            Search
          </Button>
        </form>
        {canManage && (
          <div className="flex items-center gap-2">
            <Switch
              id="show-inactive"
              checked={showInactive}
              onCheckedChange={(v) => {
                setShowInactive(v);
                setPage(1);
              }}
            />
            <Label htmlFor="show-inactive" className="text-sm">
              Show inactive / deleted
            </Label>
          </div>
        )}
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Catalog
              </CardTitle>
              <CardDescription className="mt-1">
                {totalProducts} product{totalProducts !== 1 ? "s" : ""} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProductsTableSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Failed to load products. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Retry
              </Button>
            </div>
          ) : productsList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Package className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No products match your search."
                  : "No products yet. Create your first product."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsList.map((product) => {
                    const pStatus = getProductStatus(product);
                    return (
                      <TableRow
                        key={product.id}
                        className={pStatus === "deleted" ? "opacity-60" : undefined}
                      >
                        <TableCell>
                          {product.image_url ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="h-10 w-10 rounded object-cover"
                              />
                            </>
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {typeof product.category === "string"
                            ? product.category
                            : product.category?.name ?? "\u2014"}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(product.price)}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              product.stock <= (product.low_stock_threshold ?? 10)
                                ? "font-semibold text-destructive"
                                : ""
                            }
                          >
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          {pStatus === "deleted" ? (
                            <Badge variant="destructive">Deleted</Badge>
                          ) : pStatus === "active" ? (
                            <Badge className="bg-success text-success-foreground">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Actions for ${product.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {/* View Profile */}
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(`/dashboard/products/${product.id}`)
                                }
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Profile
                              </DropdownMenuItem>

                              {/* Edit / Delete */}
                              {canManage && !product.deleted_at && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditing(product);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleting(product)}
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}

                              {/* Restore Deleted */}
                              {canManage && product.deleted_at && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleRestore(product)}
                                    disabled={restoringId === product.id}
                                  >
                                    {restoringId === product.id ? (
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                      <RotateCcw className="mr-2 h-4 w-4" />
                                    )}
                                    Restore
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editingProduct={editing}
        onSuccess={mutate}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={(v) => !v && setDeleting(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleting?.name}? This action can
              be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/80"
              onClick={handleDelete}
              disabled={deleteLoading}
            >
              {deleteLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
