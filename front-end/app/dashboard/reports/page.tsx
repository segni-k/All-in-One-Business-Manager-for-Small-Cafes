"use client";

import { useState } from "react";
import {
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  RefreshCw,
  CalendarDays,
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
import {
  useDailyReports,
  useMonthlyReports,
  useYearlyReports,
  useOverallReport,
} from "@/lib/hooks";
import { useAuth } from "@/lib/auth-context";
import { format } from "date-fns";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const tooltipStyle = {
  backgroundColor: "hsl(var(--card))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "0.5rem",
  fontSize: "12px",
};

function SummaryCards({
  totalSales,
  totalProfit,
  totalOrders,
}: {
  totalSales: number;
  totalProfit: number;
  totalOrders: number;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Sales
          </CardTitle>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
            <DollarSign className="h-4 w-4 text-card" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold font-mono">{formatCurrency(totalSales)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Profit / Loss
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
  );
}

function ReportLoading() {
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

function ReportError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-5 w-5 text-destructive" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-2 h-4 w-4" />
        Retry
      </Button>
    </div>
  );
}

function DailyTab() {
  const { data, isLoading, error, mutate } = useDailyReports();
  const reports = data ?? [];

  if (isLoading) return <ReportLoading />;
  if (error) return <ReportError message="Failed to load daily reports." onRetry={mutate} />;
  if (!reports.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-12">
        <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No daily report data available yet.</p>
      </div>
    );
  }

  const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.order_count, 0);

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards totalSales={totalSales} totalProfit={totalProfit} totalOrders={totalOrders} />
      <Card>
        <CardHeader>
          <CardTitle>Daily Sales & Profit Trend</CardTitle>
          <CardDescription>Last 30 days performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reports}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tickFormatter={(v) => format(new Date(v), "MMM d")} />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  labelFormatter={(v) => format(new Date(v as string), "MMM d, yyyy")}
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={tooltipStyle}
                />
                <Legend />
                <Area type="monotone" dataKey="total_sales" name="Sales" stroke="hsl(172, 66%, 30%)" fillOpacity={0.2} fill="hsl(172, 66%, 30%)" />
                <Area type="monotone" dataKey="profit" name="Profit" stroke="hsl(38, 92%, 50%)" fillOpacity={0.2} fill="hsl(38, 92%, 50%)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MonthlyTab() {
  const { data, isLoading, error, mutate } = useMonthlyReports();
  const reports = data ?? [];

  if (isLoading) return <ReportLoading />;
  if (error) return <ReportError message="Failed to load monthly reports." onRetry={mutate} />;

  const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.order_count, 0);

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards totalSales={totalSales} totalProfit={totalProfit} totalOrders={totalOrders} />
      <Card>
        <CardHeader>
          <CardTitle>Monthly Sales & Profit</CardTitle>
          <CardDescription>Current year month-by-month view</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="total_sales" name="Sales" fill="hsl(172, 66%, 30%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function YearlyTab() {
  const { data, isLoading, error, mutate } = useYearlyReports();
  const reports = data ?? [];

  if (isLoading) return <ReportLoading />;
  if (error) return <ReportError message="Failed to load yearly reports." onRetry={mutate} />;

  const totalSales = reports.reduce((sum, r) => sum + r.total_sales, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.order_count, 0);

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards totalSales={totalSales} totalProfit={totalProfit} totalOrders={totalOrders} />
      <Card>
        <CardHeader>
          <CardTitle>Yearly Sales & Profit</CardTitle>
          <CardDescription>Multi-year performance trend</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reports}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="total_sales" name="Sales" fill="hsl(172, 66%, 30%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="hsl(38, 92%, 50%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OverallTab() {
  const { data, isLoading, error, mutate } = useOverallReport();
  const report = data;

  if (isLoading) return <ReportLoading />;
  if (error || !report) return <ReportError message="Failed to load overall report." onRetry={mutate} />;

  return (
    <div className="flex flex-col gap-6">
      <SummaryCards
        totalSales={report.total_sales}
        totalProfit={report.profit}
        totalOrders={report.order_count}
      />
      <Card>
        <CardHeader>
          <CardTitle>Overall Breakdown</CardTitle>
          <CardDescription>All-time business totals</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Total Sales</TableHead>
                <TableHead>Total Cost</TableHead>
                <TableHead>Profit / Loss</TableHead>
                <TableHead>Total Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-mono">{formatCurrency(report.total_sales)}</TableCell>
                <TableCell className="font-mono">{formatCurrency(report.total_cost)}</TableCell>
                <TableCell className={`font-mono font-semibold ${report.profit >= 0 ? "text-success" : "text-destructive"}`}>
                  {formatCurrency(report.profit)}
                </TableCell>
                <TableCell>{report.order_count}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

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
        <p className="text-muted-foreground">Daily, monthly, yearly and all-time performance.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="overall">Overall</TabsTrigger>
        </TabsList>
        <TabsContent value="daily" className="mt-4">
          <DailyTab />
        </TabsContent>
        <TabsContent value="monthly" className="mt-4">
          <MonthlyTab />
        </TabsContent>
        <TabsContent value="yearly" className="mt-4">
          <YearlyTab />
        </TabsContent>
        <TabsContent value="overall" className="mt-4">
          <OverallTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
