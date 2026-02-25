"use client";

import React, { useMemo, useState } from "react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  AlertTriangle,
  CreditCard,
  DollarSign,
  RefreshCw,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useProducts } from "@/lib/hooks";
import { orders as ordersApi } from "@/lib/api";
import type { Product } from "@/lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

type CartLine = {
  product: Product;
  quantity: number;
};

function POSLoading() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>
      ))}
    </div>
  );
}

export default function PosPage() {
  const { hasPermission } = useAuth();
  const canUsePos = hasPermission("use_pos");

  const [searchQuery, setSearchQuery] = useState("");
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [status, setStatus] = useState("paid");
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, error, mutate } = useProducts({
    page: 1,
    search: searchQuery || undefined,
    include_inactive: false,
  });

  const [cart, setCart] = useState<Record<number, CartLine>>({});

  const products = data?.data ?? [];

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const subtotal = useMemo(
    () =>
      cartLines.reduce((sum, line) => sum + line.product.price * line.quantity, 0),
    [cartLines]
  );
  const discountValue = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountValue);

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev[product.id];
      const quantity = existing ? existing.quantity + 1 : 1;
      return {
        ...prev,
        [product.id]: { product, quantity },
      };
    });
  }

  function updateQuantity(productId: number, delta: number) {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) return prev;
      const nextQty = existing.quantity + delta;
      if (nextQty <= 0) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: { ...existing, quantity: nextQty },
      };
    });
  }

  async function submitOrder() {
    if (cartLines.length === 0) {
      toast.error("Add items to the cart first.");
      return;
    }

    setSubmitting(true);
    try {
      await ordersApi.create({
        discount: discountValue,
        payment_method: paymentMethod as "cash" | "card" | "mobile_money",
        status: status as "paid" | "pending",
        items: cartLines.map((line) => ({
          product_id: line.product.id,
          quantity: line.quantity,
        })),
      });

      toast.success("Order created successfully.");
      setCart({});
      setDiscount("0");
      mutate();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create order.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!canUsePos) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to use POS.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Point of Sale
          </h1>
          <p className="text-muted-foreground">
            Create orders quickly and keep stock in sync.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>Select items to add to the cart</CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <POSLoading />
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
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No products available.
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.sku}</p>
                      <p className="text-sm font-mono">
                        {formatCurrency(product.price)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {product.stock <= (product.low_stock_threshold ?? 10) && (
                        <Badge variant="outline" className="text-destructive">
                          Low stock
                        </Badge>
                      )}
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        disabled={product.stock <= 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
            <CardDescription>Review items before checkout</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {cartLines.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-sm text-muted-foreground">
                <ShoppingCart className="h-6 w-6" />
                Cart is empty.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {cartLines.map((line) => (
                  <div key={line.product.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{line.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(line.product.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(line.product.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-sm font-medium">{line.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(line.product.id, 1)}
                        disabled={line.quantity >= line.product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-3 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="discount">Discount</Label>
                <Input
                  id="discount"
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(total)}</span>
              </div>

              <div className="grid gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <span className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Cash
                        </span>
                      </SelectItem>
                      <SelectItem value="card">
                        <span className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Card
                        </span>
                      </SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label>Payment Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                className="mt-2"
                onClick={submitOrder}
                disabled={submitting || cartLines.length === 0}
              >
                {submitting ? "Submitting..." : "Complete Sale"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
