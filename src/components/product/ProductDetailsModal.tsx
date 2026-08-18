import React, { useState, useEffect } from 'react';
import type { Product } from '../../types';
import { useCartStore, useNotificationStore } from '../../context/store';
import { useNavigate } from 'react-router-dom';

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCart: () => void;
}

const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({
  product,
  isOpen,
  onClose,
  onOpenCart,
}) => {
  const { addToCart } = useCartStore();
  const { showNotif } = useNotificationStore();
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (product) {
      // Find the first available size
      const sizes = ['S', 'M', 'L'];
      for (const size of sizes) {
        if ((product.sizeStock[size] || 0) > 0) {
          setSelectedSize(size);
          break;
        }
      }
    }
  }, [product]);

  if (!product) return null;

  const handleAddToCart = () => {
    addToCart({
      id: product.dbId,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      size: selectedSize,
      color: 'Baby Blue',
      visual: product.visual,
      quantity,
    });
    showNotif(`${product.name} added to cart`);
    onClose();
    onOpenCart();
  };

  const handleBuyNow = () => {
    addToCart({
      id: product.dbId,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      size: selectedSize,
      color: 'Baby Blue',
      visual: product.visual,
      quantity,
    });
    onClose();
    navigate('/checkout');
  };

  const handleWishlist = () => {
    showNotif(`${product.name} saved ♥`);
  };

  return (
    <div className={`pdp-ov ${isOpen ? 'open' : ''}`}>
      <div className="pdp-modal">
        <button className="pdp-x" onClick={onClose}>
          ×
        </button>
        <div className="pdp-left">
          {product.visual.startsWith('/images/') ? (
            <img src={product.visual} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div className="pdp-img">{product.visual || 'H.S'}</div>
          )}
        </div>
        <div className="pdp-right">
          <div className="pdp-cat">{product.cat} — Collection 01</div>
          <div className="pdp-name">{product.name}</div>
          <div className="pdp-price">{product.price.toLocaleString()} EGP</div>
          <div className="pdp-story">{product.story}</div>

          <div className="pdp-sz-label">
            <span>Select Size</span>
            <button onClick={() => setShowSizeChart(true)}>Size Guide</button>
          </div>
          <div className="pdp-sizes">
            {['S', 'M', 'L'].map((s) => {
              const isOk = (product.sizeStock[s] || 0) > 0;
              return (
                <button
                  key={s}
                  className={`pdp-sz ${selectedSize === s ? 'on' : ''} ${!isOk ? 'out-of-stock' : ''}`}
                  style={{ opacity: isOk ? 1 : 0.4, cursor: isOk ? 'pointer' : 'not-allowed' }}
                  onClick={() => isOk && setSelectedSize(s)}
                >
                  {s}
                </button>
              );
            })}
          </div>

          <div className="pdp-sz-label" style={{ marginTop: '24px', marginBottom: '8px' }}>
            <span>Quantity</span>
          </div>
          <div className="pdp-sizes" style={{ marginBottom: '24px', display: 'flex', gap: '16px' }}>
            <button style={{ border: '1px solid var(--bd)', background: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
            <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>{quantity}</span>
            <button
              style={{ border: '1px solid var(--bd)', background: 'none', cursor: (quantity >= (product.sizeStock[selectedSize] || 0)) ? 'not-allowed' : 'pointer', opacity: (quantity >= (product.sizeStock[selectedSize] || 0)) ? 0.5 : 1, padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }}
              onClick={() => setQuantity(quantity + 1)}
              disabled={quantity >= (product.sizeStock[selectedSize] || 0)}
            >+</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="pdp-atc"
              onClick={handleAddToCart}
              disabled={(product.sizeStock[selectedSize] || 0) === 0}
              style={{ opacity: (product.sizeStock[selectedSize] || 0) === 0 ? 0.5 : 1, cursor: (product.sizeStock[selectedSize] || 0) === 0 ? 'not-allowed' : 'pointer' }}
            >
              {(product.sizeStock[selectedSize] || 0) === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              className="pdp-atc"
              style={{ background: 'transparent', color: 'var(--dk)', border: '1px solid var(--dk)', opacity: (product.sizeStock[selectedSize] || 0) === 0 ? 0.5 : 1, cursor: (product.sizeStock[selectedSize] || 0) === 0 ? 'not-allowed' : 'pointer' }}
              onClick={handleBuyNow}
              disabled={(product.sizeStock[selectedSize] || 0) === 0}
            >
              Buy Now
            </button>
            <button className="pdp-wb" onClick={handleWishlist}>
              Wishlist
            </button>
          </div>

          <div>
            {(product.details || []).map((d, i) => (
              <div key={i} className="pdp-detail">
                {d}
              </div>
            ))}
          </div>

          <div className="pdp-serial">
            Serial — <span>{product.serial || ''}</span>
          </div>
        </div>
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSizeChart(false)}>
          <div style={{ position: 'relative', width: '90%', maxWidth: '600px', background: 'var(--bg)', padding: '16px', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--cr)', color: 'var(--bg)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }} onClick={() => setShowSizeChart(false)}>×</button>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 600, color: 'var(--dk)' }}>Size Guide</h3>
            <img src={`${import.meta.env.BASE_URL}images/size_chart.png`} alt="Size Chart" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailsModal;
