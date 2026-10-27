import type { CartItem } from '../types';

export interface BundleInfo {
  qualifies: boolean;
  totalPoloQty: number;
  regularSaleTotal: number;
  bundleTotal: number;
  bundleDiscount: number; // e.g. 200 for 2, 450 for 3
  originalFullTotal: number; // e.g. 2400 for 2, 3600 for 3
  totalSavedVsOriginal: number; // e.g. 1200 for 2, 1950 for 3
  label: string;
}

export const isPoloItem = (item: CartItem): boolean => {
  const name = (item.name || '').toLowerCase();
  return name.includes('linen') || name.includes('polo');
};

export const getBundleInfo = (cart: CartItem[]): BundleInfo => {
  let totalPoloQty = 0;
  let nonPoloSubtotal = 0;

  for (const item of cart) {
    const qty = item.quantity || 1;
    if (isPoloItem(item)) {
      totalPoloQty += qty;
    } else {
      nonPoloSubtotal += item.price * qty;
    }
  }

  // Pricing rules:
  // Single piece: 700 EGP (was 1,200 EGP -> save 500 EGP)
  // Buy 2 for 1,200 EGP (instead of 1,400 EGP -> save 1,200 EGP vs 2,400 EGP)
  // Buy 3 for 1,650 EGP (instead of 2,100 EGP -> save 1,950 EGP vs 3,600 EGP)
  const regularSaleTotal = totalPoloQty * 700;
  const originalFullTotal = totalPoloQty * 1200;

  let bundleTotal = 0;
  if (totalPoloQty === 0) {
    bundleTotal = 0;
  } else if (totalPoloQty === 1) {
    bundleTotal = 700;
  } else if (totalPoloQty === 2) {
    bundleTotal = 1200;
  } else if (totalPoloQty === 3) {
    bundleTotal = 1650;
  } else {
    // Multiples of 3 with optimal remainder
    const groupsOf3 = Math.floor(totalPoloQty / 3);
    const rem = totalPoloQty % 3;
    bundleTotal = groupsOf3 * 1650;
    if (rem === 2) {
      bundleTotal += 1200;
    } else if (rem === 1) {
      bundleTotal += 700;
    }
  }

  const bundleDiscount = Math.max(0, regularSaleTotal - bundleTotal);
  const totalSavedVsOriginal = Math.max(0, originalFullTotal - bundleTotal);

  let label = '';
  if (totalPoloQty === 2) {
    label = 'Buy 2 for 1,200 EGP (Save 1,200 EGP instead of 1,400)';
  } else if (totalPoloQty === 3) {
    label = 'Buy 3 for 1,650 EGP (Save 1,950 EGP instead of 2,100)';
  } else if (totalPoloQty > 3) {
    label = `Bundle & Save (${totalPoloQty} Pieces — Saved ${totalSavedVsOriginal.toLocaleString()} EGP)`;
  }

  return {
    qualifies: totalPoloQty >= 2,
    totalPoloQty,
    regularSaleTotal: regularSaleTotal + nonPoloSubtotal,
    bundleTotal: bundleTotal + nonPoloSubtotal,
    bundleDiscount,
    originalFullTotal: originalFullTotal + nonPoloSubtotal,
    totalSavedVsOriginal,
    label
  };
};

export const calculateCartTotal = (cart: CartItem[]): number => {
  return getBundleInfo(cart).bundleTotal;
};

export const calculateCartSubtotal = (cart: CartItem[]): number => {
  return getBundleInfo(cart).regularSaleTotal;
};

export const calculateCartOriginalTotal = (cart: CartItem[]): number => {
  return getBundleInfo(cart).originalFullTotal;
};
