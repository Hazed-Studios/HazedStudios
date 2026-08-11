/**
 * HAZED.STUDIOS Admin Service Layer
 * TypeScript - Database operations and business logic
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Order,
  Customer,
  Product,
  FinanceReport,
  ProductStats,
  CustomerStats,
  ValidationError,
} from './admin.config';
import { VALIDATION_RULES, MESSAGES } from './admin.config';

const TABLES = {
  ORDERS: 'orders',
  CUSTOMERS: 'customers',
  PRODUCTS: 'products',
  SIZES: 'sizes',
  LOGS: 'admin_logs',
};

export class AdminService {
  private supabase: SupabaseClient;
  private cache: Map<string, { data: any; time: number }> = new Map();

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ===== ORDER OPERATIONS =====

  async getAllOrders(limit?: number, offset: number = 0): Promise<Order[]> {
    try {
      let query = this.supabase
        .from(TABLES.ORDERS)
        .select('*, customers(*), products(*)')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching orders:', e);
      throw e;
    }
  }

  async getOrderById(orderId: number): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ORDERS)
        .select('*, customers(*), products(*)')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error fetching order:', e);
      throw e;
    }
  }

  async getOrdersByCustomer(customerId: number): Promise<Order[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ORDERS)
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching customer orders:', e);
      throw e;
    }
  }

  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ORDERS)
        .select('*, customers(*), products(*)')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching orders by status:', e);
      throw e;
    }
  }

  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ORDERS)
        .select('*, customers(*), products(*)')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching orders by date range:', e);
      throw e;
    }
  }

  async createOrder(orderData: Partial<Order>): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ORDERS)
        .insert([orderData])
        .select('*, customers(*), products(*)');

      if (error) throw error;
      this.clearCache('orders');
      return data[0];
    } catch (e) {
      console.error('Error creating order:', e);
      throw e;
    }
  }

  async updateOrder(orderId: number, updates: Partial<Order>): Promise<Order> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ORDERS)
        .update(updates)
        .eq('id', orderId)
        .select('*, customers(*), products(*)');

      if (error) throw error;
      this.clearCache('orders');
      return data[0];
    } catch (e) {
      console.error('Error updating order:', e);
      throw e;
    }
  }

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    return this.updateOrder(orderId, { status: status as any });
  }

  async deleteOrder(orderId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(TABLES.ORDERS)
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      this.clearCache('orders');
      return true;
    } catch (e) {
      console.error('Error deleting order:', e);
      throw e;
    }
  }

  async duplicateOrder(orderId: number): Promise<Order> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) throw new Error(MESSAGES.error.orderNotFound);

      const newOrder = {
        customer_id: order.customer_id,
        product_id: order.product_id,
        size: order.size,
        quantity: order.quantity || 1,
        total_price: order.total_price,
        address: order.address,
        governorate: order.governorate,
        status: 'Pending' as const,
      };

      return this.createOrder(newOrder);
    } catch (e) {
      console.error('Error duplicating order:', e);
      throw e;
    }
  }

  // ===== CUSTOMER OPERATIONS =====

  async getAllCustomers(limit?: number, offset: number = 0): Promise<Customer[]> {
    try {
      let query = this.supabase
        .from(TABLES.CUSTOMERS)
        .select('*')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error('Error fetching customers:', e);
      throw e;
    }
  }

  async getCustomerById(customerId: number): Promise<Customer> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CUSTOMERS)
        .select('*')
        .eq('id', customerId)
        .single();

      if (error) throw error;
      return data;
    } catch (e) {
      console.error('Error fetching customer:', e);
      throw e;
    }
  }

  async getCustomerByPhone(phone: string): Promise<Customer | null> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CUSTOMERS)
        .select('*')
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data || null;
    } catch (e) {
      console.error('Error fetching customer by phone:', e);
      throw e;
    }
  }

  async createCustomer(customerData: Partial<Customer>): Promise<Customer> {
    try {
      const errors = this.validateCustomer(customerData);
      if (errors.length) throw new Error(errors[0].message);

      const { data, error } = await this.supabase
        .from(TABLES.CUSTOMERS)
        .insert([customerData])
        .select();

      if (error) throw error;
      this.clearCache('customers');
      return data[0];
    } catch (e) {
      console.error('Error creating customer:', e);
      throw e;
    }
  }

  async updateCustomer(customerId: number, updates: Partial<Customer>): Promise<Customer> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.CUSTOMERS)
        .update(updates)
        .eq('id', customerId)
        .select();

      if (error) throw error;
      this.clearCache('customers');
      return data[0];
    } catch (e) {
      console.error('Error updating customer:', e);
      throw e;
    }
  }

  async deleteCustomer(customerId: number): Promise<boolean> {
    try {
      // Delete associated orders first
      await this.supabase.from(TABLES.ORDERS).delete().eq('customer_id', customerId);

      // Then delete customer
      const { error } = await this.supabase
        .from(TABLES.CUSTOMERS)
        .delete()
        .eq('id', customerId);

      if (error) throw error;
      this.clearCache('customers');
      return true;
    } catch (e) {
      console.error('Error deleting customer:', e);
      throw e;
    }
  }

  async getCustomerStats(customerId: number): Promise<CustomerStats> {
    try {
      const orders = await this.getOrdersByCustomer(customerId);

      return {
        orderCount: orders.length,
        totalSpent: orders.reduce((sum, o) => sum + (o.total_price || 0), 0),
        lastOrder:
          orders.length > 0
            ? new Date(orders[0].created_at).toLocaleDateString('en-GB')
            : null,
        firstOrder:
          orders.length > 0
            ? new Date(orders[orders.length - 1].created_at).toLocaleDateString('en-GB')
            : null,
      };
    } catch (e) {
      console.error('Error getting customer stats:', e);
      throw e;
    }
  }

  // ===== PRODUCT OPERATIONS =====

  async getAllProducts(limit?: number, offset: number = 0): Promise<Product[]> {
    try {
      let query = this.supabase
        .from(TABLES.PRODUCTS)
        .select('*, product_stock(size, quantity)')
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.range(offset, offset + limit - 1);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(this.mergeStock);
    } catch (e) {
      console.error('Error fetching products:', e);
      throw e;
    }
  }

  async getProductById(productId: number): Promise<Product> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.PRODUCTS)
        .select('*, product_stock(size, quantity)')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return this.mergeStock(data);
    } catch (e) {
      console.error('Error fetching product:', e);
      throw e;
    }
  }

  // product_stock (per-size inventory) is the single source of truth used by
  // checkout. This folds it into a size_stock map on the returned product so
  // the admin dashboard always reflects what the storefront actually sees.
  private mergeStock(row: any): Product {
    const size_stock: Record<string, number> = {};
    (row.product_stock || []).forEach((s: { size: string; quantity: number }) => {
      size_stock[s.size] = s.quantity;
    });
    const { product_stock, ...product } = row;
    return {
      ...product,
      size_stock: Object.keys(size_stock).length ? size_stock : product.size_stock,
    };
  }

  async createProduct(productData: Partial<Product>): Promise<Product> {
    try {
      const errors = this.validateProduct(productData);
      if (errors.length) throw new Error(errors[0].message);

      const { size_stock, ...rest } = productData;
      const { data, error } = await this.supabase
        .from(TABLES.PRODUCTS)
        .insert([rest])
        .select();

      if (error) throw error;
      const created = data[0];

      if (size_stock && Object.keys(size_stock).length) {
        await this.supabase
          .from('product_stock')
          .insert(
            Object.entries(size_stock).map(([size, quantity]) => ({
              product_id: created.id,
              size,
              quantity,
            }))
          );
      }

      this.clearCache('products');
      return this.getProductById(created.id);
    } catch (e) {
      console.error('Error creating product:', e);
      throw e;
    }
  }

  async updateProduct(productId: number, updates: Partial<Product>): Promise<Product> {
    try {
      const { size_stock, ...rest } = updates;
      const { error } = await this.supabase
        .from(TABLES.PRODUCTS)
        .update(rest)
        .eq('id', productId);

      if (error) throw error;

      if (size_stock && Object.keys(size_stock).length) {
        await this.supabase
          .from('product_stock')
          .upsert(
            Object.entries(size_stock).map(([size, quantity]) => ({
              product_id: productId,
              size,
              quantity,
            })),
            { onConflict: 'product_id,size' }
          );
      }

      this.clearCache('products');
      return this.getProductById(productId);
    } catch (e) {
      console.error('Error updating product:', e);
      throw e;
    }
  }

  async updateStock(
    productId: number,
    quantity: number,
    sizeStock?: Record<string, number>
  ): Promise<Product> {
    try {
      return this.updateProduct(productId, { stock: quantity, size_stock: sizeStock });
    } catch (e) {
      console.error('Error updating stock:', e);
      throw e;
    }
  }

  async deleteProduct(productId: number): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(TABLES.PRODUCTS)
        .delete()
        .eq('id', productId);

      if (error) throw error;
      this.clearCache('products');
      return true;
    } catch (e) {
      console.error('Error deleting product:', e);
      throw e;
    }
  }

  async getLowStockProducts(threshold: number = 5): Promise<Product[]> {
    try {
      const products = await this.getAllProducts();
      return products.filter((p) => p.stock <= threshold);
    } catch (e) {
      console.error('Error getting low stock products:', e);
      throw e;
    }
  }

  // ===== ANALYTICS =====

  async getRevenue(startDate?: string, endDate?: string): Promise<number> {
    try {
      let query = this.supabase.from(TABLES.ORDERS).select('total_price');

      if (startDate && endDate) {
        query = query.gte('created_at', startDate).lte('created_at', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.reduce((sum, o) => sum + (o.total_price || 0), 0);
    } catch (e) {
      console.error('Error calculating revenue:', e);
      throw e;
    }
  }

  async getTodayRevenue(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getRevenue(today.toISOString(), tomorrow.toISOString());
  }

  async getProductRevenue(productId: number): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .from(TABLES.ORDERS)
        .select('total_price')
        .eq('product_id', productId);

      if (error) throw error;
      return data.reduce((sum, o) => sum + (o.total_price || 0), 0);
    } catch (e) {
      console.error('Error getting product revenue:', e);
      throw e;
    }
  }

  async getSalesByProduct(): Promise<ProductStats[]> {
    try {
      const orders = await this.getAllOrders();
      const productSales: Record<string, ProductStats> = {};

      orders.forEach((order) => {
        const productName = order.products?.name || 'Unknown';
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            count: 0,
            revenue: 0,
            product_id: order.product_id,
          };
        }
        productSales[productName].count++;
        productSales[productName].revenue += order.total_price || 0;
      });

      return Object.values(productSales).sort((a, b) => b.revenue - a.revenue);
    } catch (e) {
      console.error('Error getting product sales:', e);
      throw e;
    }
  }

  async getSalesByDate(days: number = 30): Promise<any[]> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const orders = await this.getOrdersByDateRange(
        startDate.toISOString(),
        new Date().toISOString()
      );

      const salesByDate: Record<string, { date: string; revenue: number; orders: number }> = {};

      orders.forEach((order) => {
        const date = new Date(order.created_at).toLocaleDateString('en-GB');
        if (!salesByDate[date]) {
          salesByDate[date] = { date, revenue: 0, orders: 0 };
        }
        salesByDate[date].revenue += order.total_price || 0;
        salesByDate[date].orders++;
      });

      return Object.values(salesByDate).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (e) {
      console.error('Error getting sales by date:', e);
      throw e;
    }
  }

  async generateFinanceReport(): Promise<FinanceReport> {
    try {
      const allOrders = await this.getAllOrders();
      const total = allOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

      const today = new Date().toDateString();
      const todayRev = allOrders
        .filter((o) => new Date(o.created_at).toDateString() === today)
        .reduce((sum, o) => sum + (o.total_price || 0), 0);

      const avg = allOrders.length ? Math.round(total / allOrders.length) : 0;
      const products = await this.getAllProducts();
      const stockVal = products.reduce((sum, p) => sum + p.stock * p.price, 0);

      return {
        totalRevenue: total,
        todayRevenue: todayRev,
        orderCount: allOrders.length,
        avgOrderValue: avg,
        stockValue: stockVal,
        timestamp: new Date(),
      };
    } catch (e) {
      console.error('Error generating finance report:', e);
      throw e;
    }
  }

  // ===== VALIDATION =====

  validateProduct(product: Partial<Product>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!product.name || product.name.length < VALIDATION_RULES.product.nameMinLength) {
      errors.push({
        field: 'name',
        message: `Product name must be at least ${VALIDATION_RULES.product.nameMinLength} characters`,
      });
    }

    if (!product.sku || product.sku.length < VALIDATION_RULES.product.skuMinLength) {
      errors.push({
        field: 'sku',
        message: `SKU must be at least ${VALIDATION_RULES.product.skuMinLength} characters`,
      });
    }

    if ((product.price || 0) < VALIDATION_RULES.product.priceMin) {
      errors.push({
        field: 'price',
        message: 'Price must be greater than 0',
      });
    }

    if ((product.stock || 0) < VALIDATION_RULES.product.stockMin) {
      errors.push({
        field: 'stock',
        message: 'Stock cannot be negative',
      });
    }

    return errors;
  }

  validateCustomer(customer: Partial<Customer>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (
      !customer.name ||
      customer.name.length < VALIDATION_RULES.customer.nameMinLength
    ) {
      errors.push({
        field: 'name',
        message: `Customer name must be at least ${VALIDATION_RULES.customer.nameMinLength} characters`,
      });
    }

    if (
      !customer.phone ||
      customer.phone.length < VALIDATION_RULES.customer.phoneMinLength
    ) {
      errors.push({
        field: 'phone',
        message: `Phone must be at least ${VALIDATION_RULES.customer.phoneMinLength} digits`,
      });
    }

    if (customer.phone && customer.phone.length > VALIDATION_RULES.customer.phoneMaxLength) {
      errors.push({
        field: 'phone',
        message: `Phone cannot exceed ${VALIDATION_RULES.customer.phoneMaxLength} digits`,
      });
    }

    return errors;
  }

  // ===== CACHE MANAGEMENT =====

  clearCache(type?: string): void {
    if (!type) {
      this.cache.clear();
    } else {
      for (const key of this.cache.keys()) {
        if (key.startsWith(type)) {
          this.cache.delete(key);
        }
      }
    }
  }

  getCache(key: string): any {
    const cached = this.cache.get(key);
    return cached?.data;
  }

  setCache(key: string, data: any): void {
    this.cache.set(key, { data, time: Date.now() });
  }
}

export default AdminService;
