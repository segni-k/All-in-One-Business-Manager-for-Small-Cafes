"use client";

import { useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  ShoppingCart,
  RefreshCw,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useDailyReports, useMonthlyReports } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

// ---- Shared chart tooltip style ----
const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: "12px",
};

// ---- Daily Report Tab ----
function DailyReportTab() {
  const { data, isLoading, error, mutate } = useDailyReports();
  const reports = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load daily reports.
        </p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No daily report data available yet.
        </p>
      </div>
    );
  }

  const chartData = reports.map((r) => ({
    date: format(new Date(r.date), "MMM d"),
    Revenue: r.total_sales,
    Cost: r.total_cost,
    Profit: r.profit,
  }));

  const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.order_count, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <DollarSign className="h-4 w-4 text-card" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalSales)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${totalProfit >= 0 ? "bg-success" : "bg-destructive"}`}
            >
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-card" />
              ) : (
                <TrendingDown className="h-4 w-4 text-card" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}
            >
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-2">
              <ShoppingCart className="h-4 w-4 text-card" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart -- Area chart for daily trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Daily Revenue & Profit Trend
          </CardTitle>
          <CardDescription>
            Revenue and profit over recent days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="revenueGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                  <linearGradient
                    id="profitAreaGrad"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
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
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="date"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="hsl(172, 66%, 30%)"
                  strokeWidth={2}
                  fill="url(#revenueGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="Profit"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2}
                  fill="url(#profitAreaGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Breakdown</CardTitle>
          <CardDescription>Detailed daily profit and loss</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Orders</TableHead>
                  <TableHead className="text-right">
                    Total Revenue
                  </TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Profit / Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.date}>
                    <TableCell className="font-medium">
                      {format(new Date(report.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.order_count}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(report.total_sales)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(report.total_cost)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        report.profit >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(report.profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Monthly Report Tab ----
function MonthlyReportTab() {
  const { data, isLoading, error, mutate } = useMonthlyReports();
  const reports = data?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-5 w-5 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground">
          Failed to load monthly reports.
        </p>
        <Button variant="outline" size="sm" onClick={() => mutate()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No monthly report data available yet.
        </p>
      </div>
    );
  }

  const chartData = reports.map((r) => ({
    month: r.month,
    Revenue: r.total_sales,
    Cost: r.total_cost,
    Profit: r.profit,
  }));

  const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.order_count, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <DollarSign className="h-4 w-4 text-card" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">
              {formatCurrency(totalSales)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Profit
            </CardTitle>
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-md ${totalProfit >= 0 ? "bg-success" : "bg-destructive"}`}
            >
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-card" />
              ) : (
                <TrendingDown className="h-4 w-4 text-card" />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? "text-success" : "text-destructive"}`}
            >
              {formatCurrency(totalProfit)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-2">
              <ShoppingCart className="h-4 w-4 text-card" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Chart -- Bar chart for monthly */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Monthly Revenue & Profit
          </CardTitle>
          <CardDescription>Monthly financial overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="month"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                />
                <Legend />
                <Bar
                  dataKey="Revenue"
                  fill="hsl(172, 66%, 30%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Cost"
                  fill="hsl(220, 20%, 70%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="Profit"
                  fill="hsl(38, 92%, 50%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
          <CardDescription>Detailed monthly profit and loss</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total Orders</TableHead>
                  <TableHead className="text-right">
                    Total Revenue
                  </TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Profit / Loss</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.month}>
                    <TableCell className="font-medium">
                      {report.month}
                    </TableCell>
                    <TableCell className="text-right">
                      {report.order_count}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(report.total_sales)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(report.total_cost)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-semibold ${
                        report.profit >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {formatCurrency(report.profit)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Main ----
export default function ReportsPage() {
  const { hasPermission } = useAuth();
  const [tab, setTab] = useState("daily");

  if (!hasPermission("view_reports")) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </div>
        <p className="text-sm font-medium text-foreground">Access Denied</p>
        <p className="text-sm text-muted-foreground">
          You do not have permission to view reports.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Reports
        </h1>
        <p className="text-muted-foreground">
          View your business profit and loss reports.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="daily">Daily Report</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Report</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          <DailyReportTab />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <MonthlyReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
