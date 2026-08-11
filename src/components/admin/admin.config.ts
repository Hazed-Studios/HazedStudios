/**
 * HAZED.STUDIOS Admin Configuration
 * TypeScript - Environment & Constants
 */

export interface AdminConfig {
  supabase: {
    url: string;
    key: string;
  };
  features: {
    orderTracking: boolean;
    customerAnalytics: boolean;
    productInventory: boolean;
    financialReports: boolean;
    whatsappIntegration: boolean;
    bulkExport: boolean;
    orderDuplication: boolean;
  };
  orderStatuses: OrderStatus[];
  governorates: string[];
  collection: {
    name: string;
    totalPieces: number;
    year: number;
    city: string;
  };
  pagination: {
    ordersPerPage: number;
    customersPerPage: number;
    productsPerPage: number;
  };
  cache: {
    ttl: number;
    enabled: boolean;
  };
  notification: {
    duration: number;
    position: string;
  };
  colors: Record<string, string>;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: number;
  customer_id: number;
  product_id: number;
  customers?: Customer;
  products?: Product;
  size: string;
  quantity: number;
  total_price: number;
  address: string;
  governorate: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  governorate?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrder?: string;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  size_stock?: Record<string, number>;
  collection?: string;
  description?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceReport {
  totalRevenue: number;
  todayRevenue: number;
  orderCount: number;
  avgOrderValue: number;
  stockValue: number;
  timestamp: Date;
}

export interface ProductStats {
  name: string;
  count: number;
  revenue: number;
  product_id?: number;
}

export interface CustomerStats {
  orderCount: number;
  totalSpent: number;
  lastOrder: string | null;
  firstOrder: string | null;
}

export interface ValidationError {
  field: string;
  message: string;
}

export const ADMIN_CONFIG: AdminConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  },

  features: {
    orderTracking: true,
    customerAnalytics: true,
    productInventory: true,
    financialReports: true,
    whatsappIntegration: true,
    bulkExport: true,
    orderDuplication: true,
  },

  orderStatuses: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],

  governorates: [
    'Cairo',
    'Giza',
    'Qalyubia',
    'Dakahlia',
    'Damietta',
    'Port Said',
    'Ismailia',
    'Suez',
    'Sharqia',
    'Kafr El Sheikh',
    'Beheira',
    'Alexandria',
    'Matrouh',
    'North Sinai',
    'South Sinai',
    'Fayoum',
    'Minya',
    'Assiut',
    'Sohag',
    'Qena',
    'Luxor',
    'Aswan',
    'Red Sea',
    'New Valley',
  ],

  collection: {
    name: 'Collection 01',
    totalPieces: 50,
    year: 2026,
    city: 'Cairo, Egypt',
  },

  pagination: {
    ordersPerPage: 25,
    customersPerPage: 20,
    productsPerPage: 12,
  },

  cache: {
    ttl: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  },

  notification: {
    duration: 3000,
    position: 'bottom-right',
  },

  colors: {
    primary: 'var(--cr)',
    secondary: 'var(--bl)',
    success: 'var(--green)',
    danger: 'var(--red)',
    warning: 'var(--amber)',
    dark: 'var(--dk)',
    light: 'var(--bg)',
  },
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  'Pending': '#d68910',
  'Confirmed': '#27a06a',
  'Shipped': '#97C6E0',
  'Delivered': '#27a06a',
  'Cancelled': '#c0392b',
};

export const MESSAGES = {
  success: {
    orderCreated: 'Order created successfully',
    orderUpdated: 'Order updated',
    orderDeleted: 'Order deleted',
    productCreated: 'Product created',
    productUpdated: 'Product updated',
    productDeleted: 'Product deleted',
    stockUpdated: 'Stock updated',
    customerDeleted: 'Customer deleted',
    exported: 'Data exported successfully',
  },
  error: {
    orderNotFound: 'Order not found',
    productNotFound: 'Product not found',
    customerNotFound: 'Customer not found',
    invalidInput: 'Invalid input provided',
    insufficientStock: 'Insufficient stock',
    operationFailed: 'Operation failed',
    networkError: 'Network error',
    authRequired: 'Authentication required',
  },
  confirm: {
    deleteOrder: 'Delete this order? This cannot be undone.',
    deleteProduct: 'Delete this product? This cannot be undone.',
    deleteCustomer: 'Delete this customer? All orders will also be deleted.',
  },
};

export const VALIDATION_RULES = {
  product: {
    nameMinLength: 3,
    skuMinLength: 2,
    priceMin: 0,
    stockMin: 0,
  },
  customer: {
    nameMinLength: 2,
    phoneMinLength: 10,
    phoneMaxLength: 15,
  },
  order: {
    minTotalPrice: 1,
  },
};

export type PermissionLevel = 'super_admin' | 'admin' | 'manager' | 'viewer';

export const PERMISSION_LEVELS: Record<PermissionLevel, Record<string, string[]>> = {
  super_admin: {
    orders: ['view', 'create', 'update', 'delete'],
    products: ['view', 'create', 'update', 'delete'],
    customers: ['view', 'delete'],
    analytics: ['view', 'export'],
    settings: ['view', 'update'],
  },
  admin: {
    orders: ['view', 'create', 'update'],
    products: ['view', 'create', 'update'],
    customers: ['view'],
    analytics: ['view', 'export'],
    settings: ['view'],
  },
  manager: {
    orders: ['view', 'update'],
    products: ['view'],
    customers: ['view'],
    analytics: ['view'],
    settings: [],
  },
  viewer: {
    orders: ['view'],
    products: ['view'],
    customers: ['view'],
    analytics: ['view'],
    settings: [],
  },
};
