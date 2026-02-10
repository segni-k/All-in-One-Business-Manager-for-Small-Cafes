"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Eye,
  Pencil,
  XCircle,
  ShoppingCart,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Minus,
  MoreHorizontal,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useOrders, useProducts } from "@/lib/hooks";
import { orders as ordersApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type {
  Order,
  OrderItemPayload,
  OrderPayload,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Product,
} from "@/lib/types";
import { format } from "date-fns";

// ---- Helpers ----
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function statusBadgeVariant(status: OrderStatus) {
  switch (status) {
    case "completed":
      return "default" as const;
    case "cancelled":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function statusBadgeClass(status: OrderStatus) {
  if (status === "completed") return "bg-success text-success-foreground";
  return "";
}

function paymentStatusBadgeVariant(status: PaymentStatus) {
  switch (status) {
    case "paid":
      return "default" as const;
    case "refunded":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function paymentStatusBadgeClass(status: PaymentStatus) {
  if (status === "paid") return "bg-success text-success-foreground";
  return "";
}

function formatPaymentMethod(method: string) {
  const map: Record<string, string> = {
    cash: "Cash",
    credit_card: "Credit Card",
    debit_card: "Debit Card",
    e_wallet: "E-Wallet",
    other: "Other",
  };
  return map[method] ?? method;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
  { value: "e_wallet", label: "E-Wallet" },
  { value: "other", label: "Other" },
];

const ORDER_STATUSES: { value: OrderStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

// ---- Order Details Dialog ----
function OrderDetailsDialog({
  open,
  onClose,
  order,
}: {
  open: boolean;
  onClose: () => void;
  order: Order;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Order #{order.id}</DialogTitle>
          <DialogDescription>
            Created{" "}
            {format(new Date(order.created_at), "MMM d, yyyy h:mm a")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {/* Status row */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              variant={statusBadgeVariant(order.status)}
              className={statusBadgeClass(order.status)}
            >
              {order.status}
            </Badge>
            <Badge
              variant={paymentStatusBadgeVariant(order.payment_status)}
              className={paymentStatusBadgeClass(order.payment_status)}
            >
              {order.payment_status}
            </Badge>
            <Badge variant="outline">
              {formatPaymentMethod(order.payment_method)}
            </Badge>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 rounded-md bg-muted p-3">
            <div>
              <p className="text-xs text-muted-foreground">Subtotal</p>
              <p className="font-mono font-medium">
                {formatCurrency(order.subtotal)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Discount</p>
              <p className="font-mono font-medium">
                {formatCurrency(order.discount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Grand Total</p>
              <p className="font-mono text-lg font-bold">
                {formatCurrency(order.grand_total ?? order.total)}
              </p>
            </div>
          </div>

          {/* User */}
          {order.user && (
            <div>
              <p className="text-xs text-muted-foreground">Customer</p>
              <p className="text-sm font-medium">
                {order.user.name} ({order.user.email})
              </p>
            </div>
          )}

          {order.notes && (
            <div>
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}

          <Separator />

          {/* Items table */}
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">
              Order Items
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.product?.name ?? `Product #${item.product_id}`}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(item.subtotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Create / Edit Order Dialog ----
function OrderFormDialog({
  open,
  onClose,
  onSuccess,
  editingOrder,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingOrder: Order | null;
}) {
  const { data: productsData } = useProducts({ page: 1 });
  const [items, setItems] = useState<
    (OrderItemPayload & { product: Product })[]
  >([]);
  const [discount, setDiscount] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [orderStatus, setOrderStatus] = useState<OrderStatus>("pending");
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const isEditing = !!editingOrder;

  // Populate form when editing
  useEffect(() => {
    if (editingOrder) {
      setItems(
        editingOrder.items?.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          product: item.product ?? ({
            id: item.product_id,
            name: `Product #${item.product_id}`,
            price: item.unit_price,
            stock: 999,
          } as Product),
        })) ?? []
      );
      setDiscount(String(editingOrder.discount ?? 0));
      setPaymentMethod(editingOrder.payment_method ?? "cash");
      setOrderStatus(editingOrder.status === "cancelled" ? "pending" : editingOrder.status);
      setUserId(String(editingOrder.user_id ?? ""));
    } else {
      setItems([]);
      setDiscount("0");
      setPaymentMethod("cash");
      setOrderStatus("pending");
      setUserId("");
    }
    setFormError("");
    setProductSearch("");
  }, [editingOrder]);

  const availableProducts = (productsData?.data ?? []).filter(
    (p) => (p.is_active || p.status === "active") && p.stock > 0
  );

  const filteredProducts = productSearch
    ? availableProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.sku.toLowerCase().includes(productSearch.toLowerCase())
      )
    : availableProducts;

  function addItem(product: Product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error(`Only ${product.stock} available for ${product.name}`);
          return prev;
        }
        return prev.map((i) =>
          i.product_id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product_id: product.id, quantity: 1, product }];
    });
  }

  function updateQuantity(productId: number, qty: number) {
    if (qty <= 0) {
      setItems((prev) => prev.filter((i) => i.product_id !== productId));
    } else {
      const item = items.find((i) => i.product_id === productId);
      if (item && qty > item.product.stock && !isEditing) {
        toast.error(`Only ${item.product.stock} available.`);
        return;
      }
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === productId ? { ...i, quantity: qty } : i
        )
      );
    }
  }

  function removeItem(productId: number) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  const subtotal = items.reduce(
    (sum, i) => sum + i.product.price * i.quantity,
    0
  );
  const discountAmount = Number(discount) || 0;
  const grandTotal = Math.max(subtotal - discountAmount, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (items.length === 0) {
      setFormError("Please add at least one product to the order.");
      return;
    }

    setSaving(true);
    try {
      const payload: OrderPayload = {
        items: items.map(({ product_id, quantity }) => ({
          product_id,
          quantity,
        })),
        discount: discountAmount,
        payment_method: paymentMethod,
        status: orderStatus,
      };
      if (userId) payload.user_id = Number(userId);

      if (isEditing) {
        await ordersApi.update(editingOrder.id, payload);
        toast.success("Order updated successfully.");
      } else {
        await ordersApi.create(payload);
        toast.success("Order created successfully.");
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Order #${editingOrder.id}` : "Create New Order"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update items, discount, payment method, or status."
              : "Add products and configure the order details."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Top row: User ID, Payment Method, Status */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="order-user">User ID</Label>
              <Input
                id="order-user"
                type="number"
                placeholder="Customer ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                min={1}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((pm) => (
                    <SelectItem key={pm.value} value={pm.value}>
                      {pm.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select
                value={orderStatus}
                onValueChange={(v) => setOrderStatus(v as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products & Cart */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Product picker */}
            <div className="flex flex-col gap-2">
              <Label>Products</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-52 rounded-md border">
                <div className="flex flex-col p-1">
                  {filteredProducts.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No products available.
                    </p>
                  ) : (
                    filteredProducts.map((product) => {
                      const inCart = items.find(
                        (i) => i.product_id === product.id
                      );
                      return (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => addItem(product)}
                          className="flex items-center justify-between rounded-md p-2.5 text-left text-sm transition-colors hover:bg-muted"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {product.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.sku} &middot; Stock: {product.stock}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {inCart && (
                              <Badge
                                variant="secondary"
                                className="text-xs"
                              >
                                x{inCart.quantity}
                              </Badge>
                            )}
                            <span className="whitespace-nowrap font-mono text-sm">
                              {formatCurrency(product.price)}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Cart */}
            <div className="flex flex-col gap-2">
              <Label>Cart ({items.length} items)</Label>
              <ScrollArea className="h-52 rounded-md border">
                <div className="flex flex-col gap-1 p-1">
                  {items.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                      No items added yet.
                    </p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.product_id}
                        className="flex items-center justify-between rounded-md bg-muted/50 p-2.5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {item.product.name}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {formatCurrency(
                              item.product.price * item.quantity
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.quantity - 1
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 bg-transparent"
                            onClick={() =>
                              updateQuantity(
                                item.product_id,
                                item.quantity + 1
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeItem(item.product_id)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>

              {/* Totals */}
              <div className="flex flex-col gap-2 rounded-md bg-muted p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-mono">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="order-discount"
                    className="shrink-0 text-sm text-muted-foreground"
                  >
                    Discount
                  </Label>
                  <Input
                    id="order-discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="h-8 w-28 ml-auto font-mono text-right"
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-medium">Grand Total</span>
                  <span className="font-mono text-lg font-bold">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
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
            <Button type="submit" disabled={saving || items.length === 0}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Table Skeleton ----
function OrdersTableSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="ml-auto h-5 w-8" />
        </div>
      ))}
    </div>
  );
}

// ---- Main Page ----
export default function OrdersPage() {
  const { hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading, error, mutate } = useOrders({ page });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Order | null>(null);
  const [viewing, setViewing] = useState<Order | null>(null);
  const [cancelling, setCancelling] = useState<Order | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  if (!hasPermission("use_pos")) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to manage POS orders.
        </p>
      </div>
    );
  }

  async function handleCancel() {
    if (!cancelling) return;
    setCancelLoading(true);
    try {
      await ordersApi.cancel(cancelling.id);
      toast.success(`Order #${cancelling.id} cancelled. Stock restored.`);
      mutate();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to cancel order."
      );
    } finally {
      setCancelLoading(false);
      setCancelling(null);
    }
  }

  const ordersList = data?.data ?? [];
  const totalPages = data?.last_page ?? 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">POS Orders</h1>
          <p className="text-muted-foreground">
            Create and manage point-of-sale orders.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Order
        </Button>
      </div>

      {/* Orders Table Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order History
          </CardTitle>
          <CardDescription>
            {data?.total ?? 0} order{(data?.total ?? 0) !== 1 ? "s" : ""}{" "}
            total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <OrdersTableSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <p className="text-sm text-muted-foreground">
                Failed to load orders.
              </p>
              <Button variant="outline" size="sm" onClick={() => mutate()}>
                Retry
              </Button>
            </div>
          ) : ordersList.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No orders found. Create your first order.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">Subtotal</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Grand Total</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="w-16 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersList.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        #{order.id}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {order.user_id ?? "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(order.subtotal ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {formatCurrency(order.discount ?? 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {formatCurrency(
                          order.grand_total ?? order.total ?? 0
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={paymentStatusBadgeVariant(
                            order.payment_status
                          )}
                          className={paymentStatusBadgeClass(
                            order.payment_status
                          )}
                        >
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant(order.status)}
                          className={statusBadgeClass(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatPaymentMethod(order.payment_method ?? "cash")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(
                          new Date(order.created_at),
                          "MMM d, yyyy"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              aria-label={`Actions for order #${order.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setViewing(order)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </DropdownMenuItem>
                            {order.payment_status === "pending" &&
                              order.status !== "cancelled" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setEditing(order);
                                      setFormOpen(true);
                                    }}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setCancelling(order)}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      {formOpen && (
        <OrderFormDialog
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSuccess={() => mutate()}
          editingOrder={editing}
        />
      )}

      {/* View Details Dialog */}
      {viewing && (
        <OrderDetailsDialog
          open={!!viewing}
          onClose={() => setViewing(null)}
          order={viewing}
        />
      )}

      {/* Cancel Confirmation */}
      <AlertDialog
        open={!!cancelling}
        onOpenChange={(v) => !v && setCancelling(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel order{" "}
              <strong>#{cancelling?.id}</strong>? Stock will be restored
              {cancelling?.payment_status === "paid" &&
                " and the payment will be refunded"}
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelLoading}>
              Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {cancelLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
