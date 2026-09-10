import type { CartItem } from '../types';

export const calculateCartTotal = (cart: CartItem[]): number => {
  return cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
};

export const calculateCartOriginalTotal = (cart: CartItem[]): number => {
  return cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
};
