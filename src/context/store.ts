import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '../types';

interface CartState {
  cart: CartItem[];
  wishlist: number[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: number) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      wishlist: [],
      addToCart: (item) =>
        set((state) => ({ cart: [...state.cart, item] })),
      removeFromCart: (index) =>
        set((state) => ({
          cart: state.cart.filter((_, i) => i !== index),
        })),
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (id) =>
        set((state) => {
          const isWished = state.wishlist.includes(id);
          return {
            wishlist: isWished
              ? state.wishlist.filter((wId) => wId !== id)
              : [...state.wishlist, id],
          };
        }),
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
      logout: () => set({ isAdmin: false }),
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
