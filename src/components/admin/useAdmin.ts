/**
 * HAZED.STUDIOS Admin React Hooks
 * TypeScript - Custom hooks for admin panel
 */

import { useEffect, useState, useCallback } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import AdminService from './admin.service';
import type {
  Order,
  Customer,
  Product,
  FinanceReport,
  ProductStats,
  CustomerStats,
} from './admin.config';

// ===== USEADMINSERVICE =====
export function useAdminService(supabase: SupabaseClient | null) {
  const [service, setService] = useState<AdminService | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setError('Supabase client not initialized');
      setLoading(false);
      return;
    }

    try {
      const adminService = new AdminService(supabase);
      setService(adminService);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize admin service');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return { service, loading, error };
}

// ===== USEORDERS =====
export function useOrders(service: AdminService | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    try {
      const data = await service.getAllOrders();
      setOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const updateOrderStatus = useCallback(
    async (orderId: number, status: string) => {
      if (!service) return;
      try {
        await service.updateOrderStatus(orderId, status);
        await loadOrders();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update order');
      }
    },
    [service, loadOrders]
  );

  const deleteOrder = useCallback(
    async (orderId: number) => {
      if (!service) return;
      try {
        await service.deleteOrder(orderId);
        await loadOrders();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete order');
      }
    },
    [service, loadOrders]
  );

  const duplicateOrder = useCallback(
    async (orderId: number) => {
      if (!service) return;
      try {
        await service.duplicateOrder(orderId);
        await loadOrders();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to duplicate order');
      }
    },
    [service, loadOrders]
  );

  return {
    orders,
    loading,
    error,
    loadOrders,
    updateOrderStatus,
    deleteOrder,
    duplicateOrder,
  };
}

// ===== USECUSTOMERS =====
export function useCustomers(service: AdminService | null) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    try {
      const data = await service.getAllCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const createCustomer = useCallback(
    async (customerData: Partial<Customer>) => {
      if (!service) return;
      try {
        await service.createCustomer(customerData);
        await loadCustomers();
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to create customer');
      }
    },
    [service, loadCustomers]
  );

  const deleteCustomer = useCallback(
    async (customerId: number) => {
      if (!service) return;
      try {
        await service.deleteCustomer(customerId);
        await loadCustomers();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete customer');
      }
    },
    [service, loadCustomers]
  );

  const getCustomerStats = useCallback(
    async (customerId: number): Promise<CustomerStats | null> => {
      if (!service) return null;
      try {
        return await service.getCustomerStats(customerId);
      } catch (err) {
        console.error('Failed to get customer stats:', err);
        return null;
      }
    },
    [service]
  );

  return {
    customers,
    loading,
    error,
    loadCustomers,
    createCustomer,
    deleteCustomer,
    getCustomerStats,
  };
}

// ===== USEPRODUCTS =====
export function useProducts(service: AdminService | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    try {
      const data = await service.getAllProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const createProduct = useCallback(
    async (productData: Partial<Product>) => {
      if (!service) return;
      try {
        const newProduct = await service.createProduct(productData);
        await loadProducts();
        return newProduct;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to create product');
      }
    },
    [service, loadProducts]
  );

  const updateProduct = useCallback(
    async (productId: number, updates: Partial<Product>) => {
      if (!service) return;
      try {
        await service.updateProduct(productId, updates);
        await loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update product');
      }
    },
    [service, loadProducts]
  );

  const updateStock = useCallback(
    async (productId: number, quantity: number, sizeStock?: Record<string, number>) => {
      if (!service) return;
      try {
        await service.updateStock(productId, quantity, sizeStock);
        await loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update stock');
      }
    },
    [service, loadProducts]
  );

  const deleteProduct = useCallback(
    async (productId: number) => {
      if (!service) return;
      try {
        await service.deleteProduct(productId);
        await loadProducts();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete product');
      }
    },
    [service, loadProducts]
  );

  const getLowStockProducts = useCallback(
    async (threshold: number = 5): Promise<Product[]> => {
      if (!service) return [];
      try {
        return await service.getLowStockProducts(threshold);
      } catch (err) {
        console.error('Failed to get low stock products:', err);
        return [];
      }
    },
    [service]
  );

  return {
    products,
    loading,
    error,
    loadProducts,
    createProduct,
    updateProduct,
    updateStock,
    deleteProduct,
    getLowStockProducts,
  };
}

// ===== USEANALYTICS =====
export function useAnalytics(service: AdminService | null) {
  const [report, setReport] = useState<FinanceReport | null>(null);
  const [productStats, setProductStats] = useState<ProductStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFinanceReport = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    try {
      const data = await service.generateFinanceReport();
      setReport(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getSalesByProduct = useCallback(async () => {
    if (!service) return;
    setLoading(true);
    try {
      const data = await service.getSalesByProduct();
      setProductStats(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get product stats');
    } finally {
      setLoading(false);
    }
  }, [service]);

  const getTodayRevenue = useCallback(async (): Promise<number> => {
    if (!service) return 0;
    try {
      return await service.getTodayRevenue();
    } catch (err) {
      console.error('Failed to get today revenue:', err);
      return 0;
    }
  }, [service]);

  const getSalesByDate = useCallback(
    async (days: number = 30) => {
      if (!service) return [];
      try {
        return await service.getSalesByDate(days);
      } catch (err) {
        console.error('Failed to get sales by date:', err);
        return [];
      }
    },
    [service]
  );

  useEffect(() => {
    generateFinanceReport();
    getSalesByProduct();
  }, [generateFinanceReport, getSalesByProduct]);

  return {
    report,
    productStats,
    loading,
    error,
    generateFinanceReport,
    getSalesByProduct,
    getTodayRevenue,
    getSalesByDate,
  };
}

// ===== USESEARCH =====
export function useSearch<T extends Record<string, any>>(
  items: T[],
  searchFields: string[] = ['name'],
  externalQuery?: string
) {
  const [internalQuery, setInternalQuery] = useState('');
  const query = externalQuery !== undefined ? externalQuery : internalQuery;
  const [results, setResults] = useState<T[]>(items);

  useEffect(() => {
    if (!query) {
      setResults(items);
      return;
    }

    const q = query.toLowerCase();
    const filtered = items.filter((item) =>
      searchFields.some((field) => {
        // supports dotted paths like 'customers.name'
        const value = field.split('.').reduce((obj, key) => obj?.[key], item as any);
        return value && String(value).toLowerCase().includes(q);
      })
    );

    setResults(filtered);
  }, [query, items, searchFields]);

  return { query, setQuery: setInternalQuery, results };
}

// ===== USEPAGINATION =====
export interface UsePaginationResult<T> {
  currentPage: number;
  itemsPerPage: number;
  total: number;
  totalPages: number;
  items: T[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 10
): UsePaginationResult<T> {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / itemsPerPage);

  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const paginatedItems = items.slice(start, end);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  }, [totalPages]);

  const nextPage = useCallback(() => {
    if (end < items.length) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [end, items.length]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  return {
    currentPage,
    itemsPerPage,
    total: items.length,
    totalPages,
    items: paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    canGoNext: end < items.length,
    canGoPrev: currentPage > 1,
  };
}

// ===== USEFILTER =====
export function useFilter<T extends Record<string, any>>(items: T[]) {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [filtered, setFiltered] = useState<T[]>(items);

  useEffect(() => {
    let result = [...items];

    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      if (key === 'dateRange' && value.start && value.end) {
        const start = new Date(value.start).getTime();
        const end = new Date(value.end).getTime();
        result = result.filter((item) => {
          const itemDate = new Date(item.created_at || '').getTime();
          return itemDate >= start && itemDate <= end;
        });
      } else if (key === 'priceRange' && value.min !== undefined && value.max !== undefined) {
        result = result.filter((item) => {
          const price = item.total_price || item.price || 0;
          return price >= value.min && price <= value.max;
        });
      } else {
        result = result.filter((item) => item[key] === value);
      }
    });

    setFiltered(result);
  }, [items, filters]);

  const addFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const removeFilter = useCallback((key: string) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    filtered,
    filters,
    addFilter,
    removeFilter,
    clearFilters,
  };
}
