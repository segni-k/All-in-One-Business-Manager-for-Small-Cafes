"use client";

import React from "react";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Settings,
  Package,
  BarChart3,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useDashboard } from "@/lib/hooks";
import { getApiUrl } from "@/lib/api";

// ---- Helpers ----
function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
    case "paid":
      return "bg-success text-success-foreground";
    case "pending":
      return "bg-warning text-warning-foreground";
    case "cancelled":
    case "refunded":
      return "bg-destructive text-destructive-foreground";
    default:
      return "";
  }
}

// ---- Stat Card ----
function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  iconColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  description?: string;
  trend?: "up" | "down" | "neutral";
  iconColor?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-md ${iconColor ?? "bg-primary/10"}`}
        >
          <Icon
            className={`h-4 w-4 ${iconColor ? "text-card" : "text-primary"}`}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            {trend === "up" && (
              <TrendingUp className="h-3 w-3 text-success" />
            )}
            {trend === "down" && (
              <TrendingDown className="h-3 w-3 text-destructive" />
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---- Skeleton ----
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-7 w-40" />
        <Skeleton className="mt-1 h-4 w-60" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
              <Skeleton className="mt-1 h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-56" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ---- API not configured ----
function ApiNotConfigured() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {"Today's business overview at a glance."}
        </p>
      </div>
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="mt-4">API Not Configured</CardTitle>
          <CardDescription>
            Set the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
              NEXT_PUBLIC_API_URL
            </code>{" "}
            environment variable to connect to your Laravel backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-muted p-4">
            <p className="font-mono text-sm text-muted-foreground">
              NEXT_PUBLIC_API_URL=https://your-api.com/api
            </p>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Add this in the Vars section of the sidebar, then refresh.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Charts ----
function DailySalesChart({
  trends,
}: {
  trends: Array<{ date: string; total_sales: number; profit: number }>;
}) {
  if (trends.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No trend data available yet.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={trends}>
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(172, 66%, 30%)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(172, 66%, 30%)"
                stopOpacity={0}
              />
            </linearGradient>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor="hsl(38, 92%, 50%)"
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor="hsl(38, 92%, 50%)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="total_sales"
            name="Sales"
            stroke="hsl(172, 66%, 30%)"
            strokeWidth={2}
            fill="url(#salesGrad)"
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Profit"
            stroke="hsl(38, 92%, 50%)"
            strokeWidth={2}
            fill="url(#profitGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PendingOrdersChart({
  trends,
}: {
  trends: Array<{ date: string; order_count: number }>;
}) {
  if (trends.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        No order trend data available yet.
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={trends}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
          />
          <Bar
            dataKey="order_count"
            name="Orders"
            fill="hsl(172, 66%, 30%)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ---- Main Dashboard ----
export default function DashboardPage() {
  const apiConfigured = !!getApiUrl();
  const { data, isLoading, error, mutate } = useDashboard();
  const d = data;

  if (!apiConfigured) return <ApiNotConfigured />;
  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {"Today's business overview at a glance."}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center gap-4 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            Failed to load dashboard data. Please check your API connection.
          </p>
          <p className="text-xs text-muted-foreground">
            API URL:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono">
              {getApiUrl()}
            </code>
          </p>
          <Button variant="outline" size="sm" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const profit = d?.daily_profit_loss?.profit ?? 0;
  const monthlyProfit = d?.monthly_profit_loss?.profit ?? 0;
  const yearlyProfit = d?.yearly_profit_loss?.profit ?? 0;
  const trends = d?.sales_profit_trends ?? d?.daily_trends ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            {"Today's business overview at a glance."}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(d?.todays_sales ?? 0)}
          icon={DollarSign}
          iconColor="bg-primary"
          description="Total revenue today"
        />
        <StatCard
          title="Today's Orders"
          value={String(d?.today_orders_count ?? 0)}
          icon={ShoppingCart}
          iconColor="bg-chart-2"
          description="Orders placed today"
        />
        <StatCard
          title="Pending Orders"
          value={String(d?.pending_orders_count ?? d?.pending_orders ?? 0)}
          icon={Clock}
          iconColor="bg-warning"
          description="Awaiting completion"
          trend={
            (d?.pending_orders ?? 0) > 0 ? "down" : "neutral"
          }
        />
        <StatCard
          title="Low Stock Items"
          value={String(d?.low_stock_products?.length ?? 0)}
          icon={AlertTriangle}
          iconColor="bg-destructive"
          description="Products need restocking"
          trend={
            (d?.low_stock_products?.length ?? 0) > 0 ? "down" : "neutral"
          }
        />
        <StatCard
          title="Monthly P/L"
          value={formatCurrency(monthlyProfit)}
          icon={BarChart3}
          iconColor={monthlyProfit >= 0 ? "bg-success" : "bg-destructive"}
          trend={monthlyProfit >= 0 ? "up" : "down"}
          description="Current month profit/loss"
        />
      </div>

      {/* Profit Summary Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
            Profit / Loss Snapshot
          </CardTitle>
          <CardDescription className="mt-1">
              Daily, monthly, and yearly performance
          </CardDescription>
        </div>
          <div
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold ${
              profit >= 0
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {profit >= 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {formatCurrency(profit)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Daily Profit</span>
              <span className="text-lg font-bold font-mono">
                {formatCurrency(d?.daily_profit_loss?.profit ?? 0)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Monthly Profit</span>
              <span className="text-lg font-bold font-mono">
                {formatCurrency(monthlyProfit)}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Yearly Profit</span>
              <span
                className={`text-lg font-bold font-mono ${
                  yearlyProfit >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                {formatCurrency(yearlyProfit)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Sales & Profit Trends
            </CardTitle>
            <CardDescription>Daily sales and profit over time</CardDescription>
          </CardHeader>
          <CardContent>
            <DailySalesChart trends={trends} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Orders Over Time
            </CardTitle>
            <CardDescription>
              Daily order volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PendingOrdersChart trends={trends} />
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Latest orders placed today</CardDescription>
          </CardHeader>
          <CardContent>
            {d?.pending_orders_list && d.pending_orders_list.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.pending_orders_list.slice(0, 10).map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {order.order_number ?? `#${order.id}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={getStatusColor(order.status)}
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={getStatusColor(
                              order.payment_status ?? "pending"
                            )}
                          >
                            {order.payment_status ?? "N/A"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(
                            order.grand_total ?? order.total ?? 0
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10">
                <ShoppingCart className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No pending orders right now.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Low Stock Alerts
            </CardTitle>
            <CardDescription>Products below threshold</CardDescription>
          </CardHeader>
          <CardContent>
            {d?.low_stock_products && d.low_stock_products.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                      <TableHead className="text-right">Threshold</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {d.low_stock_products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">
                          {product.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {product.sku}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="destructive">{product.stock}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {product.low_stock_threshold}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-10">
                <Package className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  All products are well-stocked.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
