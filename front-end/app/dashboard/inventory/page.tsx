"use client";

import React, { useMemo, useState } from "react";
import {
  Package,
  AlertTriangle,
  RefreshCw,
  Plus,
  Pencil,
  Search,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useProducts } from "@/lib/hooks";
import { inventory as inventoryApi } from "@/lib/api";
import type { Product } from "@/lib/types";

function StockSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-8 w-24 ml-auto" />
        </div>
      ))}
    </div>
  );
}

function InventoryAdjustDialog({
  open,
  onClose,
  product,
  mode,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  mode: "restock" | "adjust";
  onSuccess: () => void;
}) {
  const [value, setValue] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const label = mode === "restock" ? "Restock" : "Adjust";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!product) return;

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      setFormError("Enter a valid number.");
      return;
    }

    if (mode === "restock" && numeric <= 0) {
      setFormError("Quantity must be greater than zero.");
      return;
    }

    if (mode === "adjust" && numeric < 0) {
      setFormError("New stock cannot be negative.");
      return;
    }

    setSaving(true);
    try {
      if (mode === "restock") {
        await inventoryApi.restock({
          product_id: product.id,
          quantity: Math.floor(numeric),
          notes: notes.trim() || undefined,
        });
      } else {
        await inventoryApi.adjust({
          product_id: product.id,
          new_stock: Math.floor(numeric),
          notes: notes.trim() || undefined,
        });
      }

      toast.success(`${label} completed for ${product.name}.`);
      onSuccess();
      onClose();
      setValue("");
      setNotes("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Update failed.";
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
          <DialogTitle>{label} Stock</DialogTitle>
          <DialogDescription>
            {product ? `${product.name} (${product.sku})` : ""}
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
            <Label htmlFor="stock-value">
              {mode === "restock" ? "Quantity" : "New Stock"}
            </Label>
            <Input
              id="stock-value"
              type="number"
              min={mode === "restock" ? 1 : 0}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="stock-notes">Notes (optional)</Label>
            <Input
              id="stock-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason or reference"
            />
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : label}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const canManageInventory = hasPermission("manage_inventory");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dialogMode, setDialogMode] = useState<"restock" | "adjust" | null>(null);

  const { data, isLoading, error, mutate } = useProducts({
    page,
    search: searchQuery || undefined,
    include_inactive: true,
  });

  const products = useMemo(() => data?.data ?? [], [data]);

  const lowStock = useMemo(
    () => products.filter((p) => p.stock <= (p.low_stock_threshold ?? 10)),
    [products]
  );

  if (!canManageInventory) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage inventory.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Monitor stock levels and record adjustments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Overview
              </CardTitle>
              <CardDescription>
                {products.length} products, {lowStock.length} low stock alerts
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <StockSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Failed to load inventory. Please try again.
              </p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <Package className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No inventory data found.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const isLow = product.stock <= (product.low_stock_threshold ?? 10);
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell>
                          <span className={isLow ? "font-semibold text-destructive" : ""}>
                            {product.stock}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={product.is_active ? "default" : "outline"}
                            className={product.is_active ? "bg-success text-success-foreground" : "text-muted-foreground"}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setDialogMode("restock");
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Restock
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedProduct(product);
                                setDialogMode("adjust");
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Adjust
                            </Button>
                          </div>
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

      <InventoryAdjustDialog
        open={!!dialogMode}
        onClose={() => setDialogMode(null)}
        product={selectedProduct}
        mode={dialogMode ?? "restock"}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
