export interface Product {
  id: number;
  dbId: number;
  name: string;
  cat: string;
  price: number;
  stock: number;
  sizeStock: Record<string, number>;
  story: string;
  details: string[];
  serial: string;
  visual: string;
  gallery?: string[];
}

export interface CartItem {
  id: number; // array index or dbId depending on logic, let's use dbId
  name: string;
  price: number;
  size: string;
  color: string;
  visual: string;
  quantity?: number;
}

export interface Customer {
  id?: number;
  name: string;
  phone: string;
  email?: string;
  governorate?: string;
  orderCount?: number;
  totalSpent?: number;
  lastOrder?: string;
}

export interface Order {
  id: number;
  created_at: string;
  customers?: Customer;
  products?: { name: string };
  size: string;
  governorate: string;
  address: string;
  total_price: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
}
