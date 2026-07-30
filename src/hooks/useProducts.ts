import { useState, useEffect } from 'react';
import type { Product } from '../types';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);

  useEffect(() => {
    // Mocking the single product drop
    setTimeout(() => {
      setProducts([
        {
          id: 1,
          dbId: 1,
          name: 'Polo Linen Shirt',
          cat: 'Tops',
          price: 1200,
          stock: 50,
          sizeStock: { 'S': 15, 'M': 20, 'L': 15 },
          story: 'Our highly anticipated drop. Crafted from premium linen, this polo redefines summer elegance with a relaxed yet tailored fit.',
          details: [
            'Premium linen blend',
            'Relaxed tailored fit',
            'Breathable'
          ],
          serial: 'DROP-01-POLO',
          visual: '/images/45305_221248_pm.jpg'
        }
      ]);
      setLoading(false);
    }, 400); // Small delay to simulate load
  }, []);

  return { products, loading, error };
};
