import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartState {
  cart: CartItem[];

  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  updateQuantity: (index: number, qty: number) => void;
  clearCart: () => void;

}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],

      addToCart: (item) =>
        set((state) => {
          const existingIndex = state.cart.findIndex(
            (i) => i.id === item.id && i.size === item.size && i.color === item.color
          );
          if (existingIndex >= 0) {
            const newCart = [...state.cart];
            newCart[existingIndex].quantity = (newCart[existingIndex].quantity || 1) + (item.quantity || 1);
            return { cart: newCart };
          }
          return { cart: [...state.cart, { ...item, quantity: item.quantity || 1 }] };
        }),
      removeFromCart: (index) =>
        set((state) => ({
          cart: state.cart.filter((_, i) => i !== index),
        })),
      updateQuantity: (index, qty) =>
        set((state) => {
          const newCart = [...state.cart];
          if (qty <= 0) {
            newCart.splice(index, 1);
          } else {
            newCart[index].quantity = qty;
          }
          return { cart: newCart };
        }),
      clearCart: () => set({ cart: [] }),

    }),
    {
      name: 'hazed-storage',
    }
  )
);

interface AdminState {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isAdmin: false,
      login: () => set({ isAdmin: true }),
      logout: () => {
        localStorage.removeItem('hazed_admin_pass');
        set({ isAdmin: false });
      },
    }),
    {
      name: 'hz_adm',
    }
  )
);

interface NotificationState {
  message: string | null;
  color: string;
  showNotif: (msg: string, color?: string) => void;
  hideNotif: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  message: null,
  color: 'var(--cr)',
  showNotif: (msg, color = 'var(--cr)') => {
    set({ message: msg, color });
    setTimeout(() => {
      set({ message: null });
    }, 2800);
  },
  hideNotif: () => set({ message: null }),
}));

interface AppState {
  isLoaded: boolean;
  setLoaded: (loaded: boolean) => void;
  isSiteUnlocked: boolean;
  unlockSite: () => void;
  lockSite: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      isLoaded: false,
      setLoaded: (loaded) => set({ isLoaded: loaded }),
      isSiteUnlocked: false,
      unlockSite: () => set({ isSiteUnlocked: true }),
      lockSite: () => set({ isSiteUnlocked: false }),
    }),
    {
      name: 'hz_app_state',
      partialize: (state) => ({ isSiteUnlocked: state.isSiteUnlocked }),
    }
  )
);
