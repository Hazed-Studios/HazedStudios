import React, { useState } from 'react';
import type { Product } from '../../types';
import { useCartStore, useNotificationStore } from '../../context/store';
import { useNavigate } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { addToCart, wishlist, toggleWishlist } = useCartStore();
  const { showNotif } = useNotificationStore();
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();

  const isWished = wishlist.includes(product.dbId);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.dbId,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      size: selectedSize,
      color: product.name.split('—').pop()?.trim() || product.name,
      visual: product.visual,
      quantity,
    });
    showNotif(`${product.name} added to cart`);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.dbId,
      name: product.name,
      price: product.price,
      oldPrice: product.oldPrice,
      size: selectedSize,
      color: product.name.split('—').pop()?.trim() || product.name,
      visual: product.visual,
      quantity,
    });
    navigate('/checkout');
  };

  const handleToggleWish = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product.dbId);
    if (!isWished) {
      showNotif(`${product.name} saved ♥`);
    } else {
      showNotif('Removed from wishlist');
    }
  };

  const handleSizeSelect = (e: React.MouseEvent, size: string, isAvailable: boolean) => {
    e.stopPropagation();
    if (isAvailable) {
      setSelectedSize(size);
    }
  };

  return (
    <div
      className="prod-card"
      data-cat={product.cat}
      onClick={() => onClick(product)}
      onMouseEnter={() => window.innerWidth > 768 && setIsHovered(true)}
      onMouseLeave={() => window.innerWidth > 768 && setIsHovered(false)}
      style={{ background: 'transparent', border: 'none' }}
    >
      <button
        className={`prod-wish ${isWished ? 'wished' : ''}`}
        onClick={handleToggleWish}
      >
        {isWished ? '♥' : '♡'}
      </button>

      <div className="prod-vis" style={{ borderRadius: '8px', overflow: 'hidden', position: 'relative', background: 'transparent' }}>
        {product.visual && (product.visual.includes('images/') || product.visual.startsWith('http')) ? (
          <>
            <img src={product.visual} alt={product.name} loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: '8px', opacity: isHovered && product.gallery?.length ? 0 : 1, transition: 'opacity 0.4s ease' }} />
            {product.gallery && product.gallery.length > 0 && (
              <img src={product.gallery[0]} alt={product.name} loading="lazy" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', borderRadius: '8px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.4s ease' }} />
            )}
          </>
        ) : (
          <div className="prod-sym">{product.visual || 'H.S'}</div>
        )}

        <div className="prod-hover" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div className="size-row" style={{ margin: 0, padding: 0 }}>
              {['S', 'M', 'L'].map((s) => {
                const isOk = (product.sizeStock[s] || 0) > 0;
                return (
                  <button
                    key={s}
                    className={`sz ${selectedSize === s ? 'on' : ''} ${!isOk ? 'out-of-stock' : ''}`}
                    style={{ opacity: isOk ? 1 : 0.4, cursor: isOk ? 'pointer' : 'not-allowed', width: '28px', height: '28px', minWidth: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                    onClick={(e) => handleSizeSelect(e, s, isOk)}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--bg)', letterSpacing: '.1em', opacity: 0.8, marginRight: '4px' }}>QTY</span>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '0px 6px', borderRadius: '4px', height: '24px' }} onClick={(e) => { e.stopPropagation(); setQuantity(Math.max(1, quantity - 1)); }}>-</button>
              <span style={{ fontSize: '11px', color: '#fff', minWidth: '12px', textAlign: 'center' }}>{quantity}</span>
              <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', padding: '0px 6px', borderRadius: '4px', height: '24px' }} onClick={(e) => { e.stopPropagation(); setQuantity(quantity + 1); }}>+</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              className="btn-atc"
              style={{ flex: 1, padding: '8px 0', fontSize: '11px' }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? 'Sold Out' : 'Add to Cart'}
            </button>
            {product.stock > 0 && (
              <button
                className="btn-atc"
                style={{ flex: 1, padding: '8px 0', fontSize: '11px', background: 'transparent', color: '#fff', border: '1px solid #fff' }}
                onClick={handleBuyNow}
              >
                Buy Now
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="prod-info">
        <div>
          <div className="prod-name">
            {product.name.toUpperCase()}
          </div>
          <div className="prod-cat">{product.cat}</div>
        </div>
        <div className="prod-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'nowrap' }}>
            {product.oldPrice && (
              <span style={{ textDecoration: 'line-through', color: 'var(--mu)', opacity: 0.6, whiteSpace: 'nowrap' }}>
                {product.oldPrice.toLocaleString()} EGP
              </span>
            )}
            <span style={{ whiteSpace: 'nowrap' }}>{product.price.toLocaleString()} EGP</span>
          </div>
          {product.oldPrice && (
            <span style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontSize: '9px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--bg)',
              background: 'var(--cr)',
              padding: '3px 6px',
              borderRadius: '3px',
              fontWeight: 700,
              whiteSpace: 'nowrap'
            }}>
              Limited Time
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
