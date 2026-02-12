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
  NotificationsResponse,
  StaffMember,
  Product,
  Order,
  DailyReport,
  MonthlyReport,
  YearlyReport,
  OverallReport,
  PaginatedResponse,
  Category,
} from "./types";

function normalizeCollection<T>(payload: T[] | { data: T[] } | undefined): T[] {
  if (!payload) return [];
  return Array.isArray(payload) ? payload : payload.data ?? [];
}

function normalizeReportItems<T extends object>(
  payload: T | T[] | { data: T[] } | undefined
): T[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if ("data" in payload && Array.isArray(payload.data)) return payload.data;
  return [payload];
}

// ==============================
// ---- Dashboard ----
export function useDashboard() {
  return useSWR<DashboardData>(
    getApiUrl() ? "dashboard" : null,
    async () => {
      const res = await dashboard.get();
      return "data" in res ? res.data : res;
    },
    { refreshInterval: 30000 }
  );
}

// ==============================
// ---- Notifications ----
export function useNotifications(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;

  return useSWR<NotificationsResponse>(
    getApiUrl() && enabled ? "notifications" : null,
    async () => {
      const res = await notifications.list();
      return {
        data: (res.data ?? []).map((item) => ({
          ...item,
          data: item.data ?? null,
          read_at: item.read_at ?? null,
        })),
        unseen_count: res.unseen_count ?? 0,
      };
    },
    { refreshInterval: 30000 }
  );
}

// ==============================
// ---- Staff ----
export function useStaff() {
  return useSWR<StaffMember[]>(
    getApiUrl() ? "staff" : null,
    async () => {
      const res = await staff.list();
      const staffList = normalizeCollection(res);
      return staffList.map((member) => ({
        ...member,
        status: member.is_active ? "active" : "inactive",
      }));
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
  return useSWR<Category[]>(
    getApiUrl() ? "product-categories" : null,
    async () => {
      const res = await products.categories();
      return res.data ?? [];
    }
  );
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
      const items = normalizeReportItems(res);
      return items.map((item) => ({
        ...item,
        order_count: (item as DailyReport & { orders_count?: number }).order_count ??
          (item as DailyReport & { orders_count?: number }).orders_count ??
          0,
      }));
    }
  );
}

export function useMonthlyReports(params?: { month?: string; year?: string }) {
  const key = params?.month || params?.year
    ? ["reports-monthly", params?.month ?? "all", params?.year ?? "current"]
    : "reports-monthly";

  return useSWR<MonthlyReport[]>(
    getApiUrl() ? key : null,
    async () => {
      const res = await reports.monthly(params);
      const items = normalizeReportItems(res);
      return items.map((item) => ({
        ...item,
        order_count: (item as MonthlyReport & { orders_count?: number }).order_count ??
          (item as MonthlyReport & { orders_count?: number }).orders_count ??
          0,
      }));
    }
  );
}

export function useYearlyReports(params?: { years?: string }) {
  const key = params?.years
    ? ["reports-yearly", params.years]
    : "reports-yearly";

  return useSWR<YearlyReport[]>(
    getApiUrl() ? key : null,
    async () => {
      const res = await reports.yearly(params);
      return normalizeCollection(res);
    }
  );
}

export function useOverallReport() {
  return useSWR<OverallReport>(
    getApiUrl() ? "reports-overall" : null,
    async () => {
      const res = await reports.overall();
      return "data" in res ? res.data : res;
    }
  );
}
