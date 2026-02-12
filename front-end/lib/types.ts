// ---- Auth & Users ----
export type Permission =
  | "manage_staff"
  | "use_pos"
  | "manage_inventory"
  | "view_reports"
  | "refund_order";

export interface Role {
  id: number;
  name: "admin" | "manager" | "pos_staff";
  description: string | null;
  permissions: {
    id: number;
    name: Permission;
    description: string | null;
  }[];
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  email_verified_at?: string | null;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role: Role;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ---- Staff ----
export type StaffStatus = "active" | "inactive";

export interface StaffMember extends User {
  status: StaffStatus;
}

export interface StaffPayload {
  name: string;
  email: string;
  password?: string;
  role_id?: number;
  status?: StaffStatus;
  is_active?: boolean;
  permissions?: Permission[];
}

// ---- Products & Categories ----
export type ProductStatus = "active" | "inactive";

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  image_url?: string | null;
  price: number;
  cost: number;
  stock: number;
  low_stock_threshold?: number;
  status?: ProductStatus;
  is_active?: boolean;
  deleted_at?: string | null;

  // ✅ FIX: backend sometimes returns string, sometimes object
  category?: Category | string | null;
}

export interface ProductPayload {
  name: string;
  sku: string;
  image_url?: string | null;
  description?: string;

  // ✅ FIX: allow undefined (matches your form)
  category_id?: number;

  price: number;
  cost: number;
  stock: number;
  low_stock_threshold?: number;
  status?: ProductStatus;
  is_active?: boolean;
}

// ---- Orders ----
export type OrderStatus = "pending" | "paid" | "cancelled" | "refunded" | "completed";
export type PaymentStatus = "pending" | "paid" | "refunded";
export type PaymentMethod =
  | "cash"
  | "card"
  | "mobile_money"
  | "credit_card"
  | "debit_card"
  | "e_wallet"
  | "other";

export interface OrderItem {
  id: number;
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: number;
  order_number?: string;
  user_id: number;
  user?: User;
  subtotal: number;
  discount: number;
  grand_total: number;
  total: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  payment_method: PaymentMethod;
  notes: string | null;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}

export interface OrderItemPayload {
  product_id: number;
  quantity: number;
}

export interface OrderPayload {
  user_id?: number;
  items: OrderItemPayload[];
  discount?: number;
  payment_method?: PaymentMethod;
  status?: OrderStatus;
  notes?: string;
}

// ---- Reports ----
export interface DailyReport {
  date: string;
  total_sales: number;
  total_cost: number;
  profit: number;
  order_count: number;
}

export interface MonthlyReport {
  month: string;
  year?: number;
  month_number?: number;
  total_sales: number;
  total_cost: number;
  profit: number;
  order_count: number;
}

export interface YearlyReport {
  year: number;
  total_sales: number;
  total_cost: number;
  profit: number;
  order_count: number;
}

export interface OverallReport {
  scope?: string;
  total_sales: number;
  total_cost: number;
  profit: number;
  order_count: number;
}

// ---- Dashboard ----
export interface DashboardData {
  todays_sales: number;
  today_orders_count: number;
  pending_orders: number;
  pending_orders_count?: number;
  pending_orders_list?: Order[];
  low_stock_products: Product[];
  recent_orders: Order[];
  sales_profit_trends?: Array<{
    date: string;
    total_sales: number;
    total_cost: number;
    profit: number;
    order_count: number;
  }>;
  daily_trends?: Array<{
    date: string;
    total_sales: number;
    total_cost: number;
    profit: number;
    order_count: number;
  }>;
  monthly_profit_loss?: {
    total_sales: number;
    total_cost: number;
    profit: number;
    order_count: number;
  };
  yearly_profit_loss?: {
    total_sales: number;
    total_cost: number;
    profit: number;
    order_count: number;
    year?: number;
  };
  daily_profit_loss: {
    total_sales: number;
    total_cost: number;
    profit: number;
    order_count?: number;
  };
}

// ---- Notifications ----
export interface AppNotification {
  id: number;
  type: string;
  message: string;
  data: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  data: AppNotification[];
  unseen_count: number;
}

// ---- Pagination ----
export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
