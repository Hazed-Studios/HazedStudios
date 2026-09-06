import type { CartItem } from '../types';

export const calculateCartTotal = (cart: CartItem[]): number => {
  let linenCount = 0;
  let otherTotal = 0;

  for (const item of cart) {
    if (item.name.toLowerCase().includes('linen') || item.name.toLowerCase().includes('polo')) {
      linenCount += item.quantity || 1;
    } else {
      otherTotal += item.price * (item.quantity || 1);
    }
  }

  const bundlesOf3 = Math.floor(linenCount / 3);
  const rem3 = linenCount % 3;
  const bundlesOf2 = Math.floor(rem3 / 2);
  const singles = rem3 % 2;

  const linenTotal = (bundlesOf3 * 1800) + (bundlesOf2 * 1300) + (singles * 750);

  return linenTotal + otherTotal;
};

export const calculateCartOriginalTotal = (cart: CartItem[]): number => {
  return cart.reduce((sum, item) => sum + item.price * (item.quantity || 1), 0);
};
