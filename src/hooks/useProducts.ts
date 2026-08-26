import { useState, useEffect } from 'react';
import type { Product } from '../types';
import { supabase } from '../lib/supabase';

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    dbId: 1,
    name: 'Polo Linen Shirt',
    cat: 'Tops',
    price: 999,
    oldPrice: 1200,
    stock: 50,
    sizeStock: { S: 15, M: 20, L: 15 },
    story:
      'Our highly anticipated drop. Crafted from premium linen, this polo redefines summer elegance with a relaxed yet tailored fit.',
    details: ['Premium linen blend', 'Relaxed tailored fit', 'Breathable'],
    serial: 'DROP-01-POLO',
    visual: `${import.meta.env.BASE_URL}images/baby blue.webp`,
    gallery: [
      `${import.meta.env.BASE_URL}images/1B.jpeg`,
      `${import.meta.env.BASE_URL}images/2B.jpeg`,
      `${import.meta.env.BASE_URL}images/3B.jpeg`,
      `${import.meta.env.BASE_URL}images/4B.jpeg`,
    ],
  },
];

const resolveImagePath = (path: string | null | undefined): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
};

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { data: rows, error: dbError } = await supabase
          .from('products')
          .select('*, product_stock(size, quantity)')
          .order('created_at', { ascending: true });

        if (dbError) throw dbError;

        if (cancelled) return;

        if (!rows || rows.length === 0) {
          // No products in the database yet — show the placeholder drop
          // instead of an empty shop page.
          setProducts(FALLBACK_PRODUCTS);
          setLoading(false);
          return;
        }

        const mapped: Product[] = rows.map((row: any) => {
          const sizeStock: Record<string, number> = {};
          (row.product_stock || []).forEach((s: { size: string; quantity: number }) => {
            sizeStock[s.size] = s.quantity;
          });
          const totalStock = Object.keys(sizeStock).length
            ? Object.values(sizeStock).reduce((sum, q) => sum + q, 0)
            : row.stock ?? 0;

          let visual = row.visual || row.image_url;
          let gallery = row.gallery || [];

          if (row.name.includes('Natural Linen')) {
            // Front, Side, Back, Side
            gallery = ['images/1N.JPG', 'images/2N.webp', 'images/3N.JPG', 'images/4N.webp'];
            visual = 'images/natural linen.webp';
          } else if (row.name.includes('Baby Blue')) {
            // Front, Side, Back, Side
            gallery = ['images/1B.jpeg', 'images/2B.jpeg', 'images/3B.jpeg', 'images/4B.jpeg'];
            visual = 'images/baby blue.webp';
          }

          return {
            id: row.id,
            dbId: row.id,
            name: row.name,
            cat: row.cat || row.collection || '',
            price: Number(row.price) || 0,
            oldPrice: row.old_price ? Number(row.old_price) : undefined,
            stock: totalStock,
            sizeStock,
            story: row.story || row.description || '',
            details: row.details || [],
            serial: row.serial || row.sku || '',
            visual: resolveImagePath(visual),
            gallery: gallery.map(resolveImagePath),
          };
        });

        setProducts(mapped);
        setLoading(false);
      } catch (e) {
        console.error('Failed to load products from Supabase, using fallback:', e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load products');
          setProducts(FALLBACK_PRODUCTS);
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Update global app state when products finish loading
  useEffect(() => {
    if (!loading) {
      import('../context/store').then(({ useAppStore }) => {
        useAppStore.getState().setLoaded(true);
      });
    }
  }, [loading]);

  return { products, loading, error };
};
