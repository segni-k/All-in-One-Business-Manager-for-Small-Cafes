import useSWR from "swr";
import {
  dashboard,
  notifications,
  staff,
  products,
  orders,
  reports,
  getApiUrl,
} from "./api";

import {
  DashboardData,
  AppNotification,
  StaffMember,
  Product,
  Order,
  DailyReport,
  MonthlyReport,
  PaginatedResponse,
  Category,
} from "./types";
import { useEffect, useState } from "react";

// ==============================
// ---- Dashboard ----
export function useDashboard() {
  return useSWR<DashboardData>(
    getApiUrl() ? "dashboard" : null,
    async () => {
      const res = await dashboard.get();
      return res.data;
    },
    { refreshInterval: 30000 }
  );
}

// ==============================
// ---- Notifications ----
export function useNotifications() {
  return useSWR<AppNotification[]>(
    getApiUrl() ? "notifications" : null,
    async () => {
      const res = await notifications.list();
      return res.data;
    }
  );
}

// ==============================
// ---- Staff ----
export function useStaff() {
  return useSWR<StaffMember[]>(
    getApiUrl() ? "staff" : null,
    async () => {
      const res = await staff.list();
      return res.data;
    }
  );
}

// ==============================
// ---- Products ----
export function useProducts(params?: {
  page?: number;
  search?: string;
  include_inactive?: boolean;
}) {
  const key = params ? ["products", params] : "products";

  return useSWR<PaginatedResponse<Product>>(
    getApiUrl() ? key : null,
    async () => {
      const res = await products.list(params);
      return res;
    }
  );
}


/* ---------------- PRODUCTS ---------------- */
/*
export function useProducts(params?: {
  page?: number;
  search?: string;
  include_inactive?: boolean;
}) {
  const [data, setData] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    products
      .list(params)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [params?.page, params?.search, params?.include_inactive]);

  return { data, loading, error };
}
*/
/* ---------------- CATEGORIES (🔥 MISSING BEFORE) ---------------- */

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
    products
      .categories()
      .then((res) => setData(res.data))
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error };
}

// ==============================
// ---- Orders ----
export function useOrders(params?: { page?: number }) {
  const key = params ? ["orders", params] : "orders";

  return useSWR<PaginatedResponse<Order>>(
    getApiUrl() ? key : null,
    async () => {
      return await orders.list(params);
    }
  );
}

// ==============================
// ---- Reports ----
export function useDailyReports(params?: { date?: string }) {
  const key = params?.date
    ? ["reports-daily", params.date]
    : "reports-daily";

  return useSWR<DailyReport[]>(
    getApiUrl() ? key : null,
    async () => {
      const res = await reports.daily(params);
      return res.data;
    }
  );
}

export function useMonthlyReports(params?: { month?: string }) {
  const key = params?.month
    ? ["reports-monthly", params.month]
    : "reports-monthly";

  return useSWR<MonthlyReport[]>(
    getApiUrl() ? key : null,
    async () => {
      const res = await reports.monthly(params);
      return res.data;
    }
  );
}

