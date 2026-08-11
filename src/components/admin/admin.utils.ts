/**
 * HAZED.STUDIOS Admin Utilities & Helpers
 * TypeScript
 */

import type { OrderStatus, Order } from './admin.config';
import { STATUS_COLORS } from './admin.config';

// ===== FORMATTING =====
export const formatters = {
  currency(amount: number): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },

  date(dateString: string, locale: string = 'en-GB'): string {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  time(dateString: string, locale: string = 'en-GB'): string {
    return new Date(dateString).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  datetime(dateString: string, locale: string = 'en-GB'): string {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString(locale) +
      ' ' +
      date.toLocaleTimeString(locale, {
        hour: '2-digit',
        minute: '2-digit',
      })
    );
  },

  phone(phone: string): string {
    if (!phone) return '—';
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, '+$1 $2 $3');
  },

  truncate(text: string, length: number = 50): string {
    if (!text) return '—';
    return text.length > length ? text.slice(0, length) + '...' : text;
  },

  capitalize(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  percentage(value: number, total: number): number {
    return total === 0 ? 0 : Math.round((value / total) * 100);
  },
};

// ===== COLORS & STYLING =====
export const styling = {
  getStatusColor(status: OrderStatus): string {
    return STATUS_COLORS[status] || '#7a6858';
  },

  getStatusBg(status: OrderStatus): string {
    const colors = STATUS_COLORS[status];
    return colors ? colors + '20' : '#7a685820';
  },

  generateColorPalette(baseColor: string): Record<string, string> {
    return {
      base: baseColor,
      light: baseColor + '20',
      dark: baseColor + 'cc',
    };
  },
};

// ===== VALIDATION =====
export const validators = {
  email(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  phone(phone: string): boolean {
    return phone.length >= 10 && /^\d+$/.test(phone);
  },

  url(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '';
  },

  isNumber(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  },
};

// ===== FILTERING & SEARCHING =====
export const filters = {
  search<T extends Record<string, any>>(
    items: T[],
    query: string,
    fields: string[] = ['name', 'phone', 'email']
  ): T[] {
    if (!query) return items;

    const q = query.toLowerCase();
    return items.filter((item) =>
      fields.some((field) => {
        const value = item[field];
        return value && String(value).toLowerCase().includes(q);
      })
    );
  },

  byStatus<T extends { status?: string }>(items: T[], status: string): T[] {
    if (!status) return items;
    return items.filter((item) => item.status === status);
  },

  byDate<T extends { created_at?: string }>(
    items: T[],
    startDate: string,
    endDate: string
  ): T[] {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return items.filter((item) => {
      const itemDate = new Date(item.created_at || '').getTime();
      return itemDate >= start && itemDate <= end;
    });
  },

  byPrice<T extends { total_price?: number; price?: number }>(
    items: T[],
    min: number = 0,
    max: number = Infinity
  ): T[] {
    return items.filter((item) => {
      const price = item.total_price || item.price || 0;
      return price >= min && price <= max;
    });
  },

  byGovernorate<T extends { governorate?: string }>(
    items: T[],
    governorate: string
  ): T[] {
    if (!governorate) return items;
    return items.filter((item) => item.governorate === governorate);
  },
};

// ===== SORTING =====
export const sorters = {
  byField<T extends Record<string, any>>(
    items: T[],
    field: string,
    direction: 'asc' | 'desc' = 'asc'
  ): T[] {
    const sorted = [...items];
    sorted.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];

      if (typeof aVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }

      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return sorted;
  },

  byDate<T extends { created_at?: string }>(
    items: T[],
    field: string = 'created_at',
    direction: 'asc' | 'desc' = 'desc'
  ): T[] {
    return this.byField(items, field, direction);
  },

  byPrice<T extends { total_price?: number; price?: number }>(
    items: T[],
    direction: 'asc' | 'desc' = 'desc'
  ): T[] {
    return items.slice().sort((a, b) => {
      const aPrice = a.total_price || a.price || 0;
      const bPrice = b.total_price || b.price || 0;
      return direction === 'asc' ? aPrice - bPrice : bPrice - aPrice;
    });
  },

  byStatus<T extends { status?: string }>(
    items: T[],
    statusOrder?: string[]
  ): T[] {
    if (!statusOrder) return items;

    return items.slice().sort((a, b) => {
      const aIndex = statusOrder.indexOf(a.status || '');
      const bIndex = statusOrder.indexOf(b.status || '');
      return aIndex - bIndex;
    });
  },
};

// ===== PAGINATION =====
export interface PaginationResult<T> {
  items: T[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const pagination = {
  paginate<T>(
    items: T[],
    page: number = 1,
    itemsPerPage: number = 10
  ): PaginationResult<T> {
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return {
      items: items.slice(start, end),
      total: items.length,
      totalPages: Math.ceil(items.length / itemsPerPage),
      currentPage: page,
      hasNext: end < items.length,
      hasPrev: page > 1,
    };
  },

  getPageNumbers(currentPage: number, totalPages: number, maxDisplay: number = 5): number[] {
    const pages: number[] = [];
    const half = Math.floor(maxDisplay / 2);

    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxDisplay - 1);

    if (end - start < maxDisplay - 1) {
      start = Math.max(1, end - maxDisplay + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  },
};

// ===== DATA EXPORT =====
export const exporters = {
  toCSV<T extends Record<string, any>>(data: T[], filename: string = 'export.csv'): void {
    if (!data || !data.length) return;

    const headers = Object.keys(data[0]);
    const rows = [
      headers,
      ...data.map((item) =>
        headers.map((header) => {
          const value = item[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'object') return JSON.stringify(value);
          return String(value).replace(/"/g, '""');
        })
      ),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');

    this.download(csv, filename, 'text/csv;charset=utf-8');
  },

  toJSON<T>(data: T[], filename: string = 'export.json'): void {
    const json = JSON.stringify(data, null, 2);
    this.download(json, filename, 'application/json');
  },

  download(content: string, filename: string, type: string): void {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

// ===== CALCULATIONS =====
export const calculations = {
  sum<T extends Record<string, any>>(items: T[], field: string): number {
    return items.reduce((sum, item) => sum + (item[field] || 0), 0);
  },

  average<T extends Record<string, any>>(items: T[], field: string): number {
    if (!items.length) return 0;
    return this.sum(items, field) / items.length;
  },

  count<T extends Record<string, any>>(items: T[], field: string, value: any): number {
    return items.filter((item) => item[field] === value).length;
  },

  group<T extends Record<string, any>>(
    items: T[],
    field: string
  ): Record<string, T[]> {
    return items.reduce(
      (groups, item) => {
        const key = String(item[field]);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      },
      {} as Record<string, T[]>
    );
  },

  getStatistics(items: number[]): {
    count: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
  } | null {
    const values = items.filter((v) => typeof v === 'number').sort((a, b) => a - b);

    if (!values.length) return null;

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median =
      values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)];

    return {
      count: values.length,
      sum,
      mean: Math.round(mean * 100) / 100,
      median,
      min: values[0],
      max: values[values.length - 1],
    };
  },
};

// ===== NOTIFICATIONS =====
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export const notifications = {
  show(message: string, type: NotificationType = 'success', duration: number = 3000): void {
    const notif = document.createElement('div');
    notif.className = `notif notif-${type} show`;
    notif.textContent = message;
    notif.style.background =
      type === 'success'
        ? 'var(--green)'
        : type === 'error'
          ? 'var(--red)'
          : type === 'warning'
            ? 'var(--amber)'
            : 'var(--blue)';

    document.body.appendChild(notif);

    setTimeout(() => {
      notif.classList.remove('show');
      setTimeout(() => notif.remove(), 400);
    }, duration);
  },

  success(message: string): void {
    this.show(message, 'success');
  },

  error(message: string): void {
    this.show(message, 'error');
  },

  warning(message: string): void {
    this.show(message, 'warning');
  },

  info(message: string): void {
    this.show(message, 'info');
  },
};

// ===== STORAGE =====
export const storage = {
  set(key: string, value: any, useSession: boolean = false): boolean {
    const store = useSession ? sessionStorage : localStorage;
    try {
      store.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },

  get<T>(key: string, useSession: boolean = false): T | null {
    const store = useSession ? sessionStorage : localStorage;
    try {
      const value = store.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.error('Storage error:', e);
      return null;
    }
  },

  remove(key: string, useSession: boolean = false): boolean {
    const store = useSession ? sessionStorage : localStorage;
    try {
      store.removeItem(key);
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },

  clear(useSession: boolean = false): boolean {
    const store = useSession ? sessionStorage : localStorage;
    try {
      store.clear();
      return true;
    } catch (e) {
      console.error('Storage error:', e);
      return false;
    }
  },
};

// ===== DEBOUNCE & THROTTLE =====
export const timing = {
  debounce<T extends (...args: any[]) => any>(func: T, delay: number = 300) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  },

  throttle<T extends (...args: any[]) => any>(func: T, limit: number = 300) {
    let inThrottle: boolean;
    return function (...args: any[]) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },
};

// ===== URL UTILITIES =====
export const urlUtils = {
  getParams(): Record<string, string> {
    const params = new URLSearchParams(window.location.search);
    return Object.fromEntries(params);
  },

  getParam(key: string): string | null {
    return new URLSearchParams(window.location.search).get(key);
  },

  setParam(key: string, value: string): void {
    const params = new URLSearchParams(window.location.search);
    params.set(key, value);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  },

  removeParam(key: string): void {
    const params = new URLSearchParams(window.location.search);
    params.delete(key);
    window.history.replaceState({}, '', `${window.location.pathname}?${params}`);
  },
};

// ===== WHATSAPP INTEGRATION =====
export const whatsapp = {
  encodeMessage(text: string): string {
    return encodeURIComponent(text);
  },

  generateOrderMessage(order: Order): string {
    const message = `
مرحباً ${order.customers?.name || ''} 🖤

شكراً لطلبك من HAZED.STUDIOS

📦 تفاصيل طلبك:
━━━━━━━━━━━━
🧥 المنتج: ${order.products?.name || ''}
📐 المقاس: ${order.size}
📍 العنوان: ${order.address}, ${order.governorate}
💰 الإجمالي: ${formatters.currency(order.total_price)}
━━━━━━━━━━━━

طلبك تم تأكيده وسيصلك خلال 3-5 أيام عمل 🚚

سنتواصل معك قريباً لتأكيد موعد التسليم.

HAZED.STUDIOS 🖤
    `.trim();

    return this.encodeMessage(message);
  },

  generateURL(phone: string, message: string): string {
    return `https://wa.me/2${phone}?text=${message}`;
  },

  sendMessage(phone: string, message: string): void {
    const url = this.generateURL(phone, this.encodeMessage(message));
    window.open(url, '_blank');
  },
};
