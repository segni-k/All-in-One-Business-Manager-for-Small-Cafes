import {
  User,
  StaffMember,
  StaffPayload,
  Product,
  ProductPayload,
  Category,
  Order,
  OrderPayload,
  DailyReport,
  MonthlyReport,
  YearlyReport,
  OverallReport,
  DashboardData,
  NotificationsResponse,
  PaginatedResponse,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export function getApiUrl() {
  return API_URL;
}

class ApiError extends Error {
  status: number;
  data?: unknown;
  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("auth_token");
}

export function setToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function removeToken() {
  localStorage.removeItem("auth_token");
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!API_URL) throw new ApiError("API URL not set", 0);

  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    if (res.status === 401) {
      removeToken();
      window.location.href = "/login";
    }
    throw new ApiError(data?.message || "Request failed", res.status, data);
  }

  if (res.status === 204) return null as T;
  return res.json();
}

// ---- Auth ----
export const auth = {
  login: (data: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  logout: () => request<void>("/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/me"),
};

// ---- Profile ----
export const profile = {
  update: (data: {
    name?: string;
    email?: string;
    avatar_url?: string | null;
    current_password?: string;
    password?: string;
    password_confirmation?: string;
  }) =>
    request<{ user: User; message: string }>("/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

// ---- Staff ----
export const staff = {
  list: () => request<StaffMember[] | { data: StaffMember[] }>("/staff"),
  create: (data: StaffPayload) =>
    request<{ data: StaffMember }>("/staff", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<StaffPayload>) =>
    request<{ data: StaffMember }>(`/staff/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  delete: (id: number) => request<void>(`/staff/${id}`, { method: "DELETE" }),
};

// ---- Products ----
export const products = {
  list: async (params?: { page?: number; search?: string; include_inactive?: boolean }) => {
    const query: Record<string, string> = {};

    if (params?.page !== undefined) query.page = String(params.page);
    if (params?.search) query.search = params.search;
    query.with_inactive = params?.include_inactive ? "1" : "0";

    const qs = new URLSearchParams(query).toString();

    const res = await request<{
      current_page: number;
      data: Product[];
      last_page: number;
      total: number;
    }>(`/products${qs ? `?${qs}` : ""}`);

    return {
      data: res.data,
      current_page: res.current_page,
      last_page: res.last_page,
      total: res.total,
    } as PaginatedResponse<Product>;
  },

  show: (id: number) => request<{ data: Product }>(`/products/${id}`),

  create: (data: ProductPayload) =>
    request<{ data: Product }>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  update: (id: number, data: Partial<ProductPayload>) =>
    request<{ data: Product }>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  delete: (id: number) => request<void>(`/products/${id}`, { method: "DELETE" }),

  restore: (id: number) =>
    request<{ data: Product }>(`/products/${id}/restore`, { method: "POST" }),

  categories: () => request<{ data: Category[] }>("/products/categories"),
  createCategory: (data: { name: string }) =>
    request<{ data: Category }>("/products/categories", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ---- Orders ----
export const orders = {
  list: (params?: { page?: number }) => {
    const qs = new URLSearchParams(
      params ? { page: String(params.page ?? 1) } : {}
    ).toString();
    return request<PaginatedResponse<Order>>(`/orders${qs ? `?${qs}` : ""}`);
  },

  create: (data: OrderPayload) =>
    request<{ data: Order }>("/orders", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (id: number, data: Partial<OrderPayload>) =>
    request<Order>(`/orders/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  cancel: (id: number) => request<Order>(`/orders/${id}/cancel`, { method: "POST" }),
  complete: (id: number) => request<Order>(`/orders/${id}/complete`, { method: "POST" }),
};

// ---- Reports ----
export const reports = {
  daily: (params?: { date?: string; days?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<DailyReport | DailyReport[] | { data: DailyReport[] }>(
      `/reports/daily${qs ? `?${qs}` : ""}`
    );
  },

  monthly: (params?: { month?: string; year?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<MonthlyReport | MonthlyReport[] | { data: MonthlyReport[] }>(
      `/reports/monthly${qs ? `?${qs}` : ""}`
    );
  },
  yearly: (params?: { years?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return request<YearlyReport[] | { data: YearlyReport[] }>(
      `/reports/yearly${qs ? `?${qs}` : ""}`
    );
  },
  overall: () => request<OverallReport | { data: OverallReport }>("/reports/overall"),
};

// ---- Dashboard ----
export const dashboard = {
  get: () => request<DashboardData | { data: DashboardData }>("/dashboard"),
};

// ---- Notifications ----
export const notifications = {
  list: () => request<NotificationsResponse>("/notifications"),
  markSeen: (id: number) =>
    request<{ data: { id: number; read_at: string | null } }>(`/notifications/${id}/seen`, {
      method: "POST",
    }),
};

export { ApiError };
