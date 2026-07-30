import React, { useState } from 'react';
import type { Product } from '../../types';
import { useCartStore, useNotificationStore } from '../../context/store';

interface ProductCardProps {
  product: Product;
  onClick: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
  const { addToCart, wishlist, toggleWishlist } = useCartStore();
  const { showNotif } = useNotificationStore();
  const [selectedSize, setSelectedSize] = useState<string>('M');

  const isWished = wishlist.includes(product.dbId);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: product.dbId,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: 'Baby Blue',
      visual: product.visual,
    });
    showNotif(`${product.name} added to bag`);
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
    <div className="prod-card rv" data-cat={product.cat} onClick={() => onClick(product)}>
      <button
        className={`prod-wish ${isWished ? 'wished' : ''}`}
        onClick={handleToggleWish}
      >
        {isWished ? '♥' : '♡'}
      </button>

      <div className="prod-vis">
        {product.visual.startsWith('/images/') ? (
          <img src={product.visual} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div className="prod-sym">{product.visual || 'H.S'}</div>
        )}
      </div>

      <div className="prod-hover">
        <div className="size-row">
          {['S', 'M', 'L'].map((s) => {
            const isOk = (product.sizeStock[s] || 0) > 0;
            return (
              <button
                key={s}
                className={`sz ${selectedSize === s ? 'on' : ''}`}
                style={{ opacity: isOk ? 1 : 0.3, cursor: isOk ? 'pointer' : 'not-allowed' }}
                onClick={(e) => handleSizeSelect(e, s, isOk)}
              >
                {s}
              </button>
            );
          })}
        </div>
        <button
          className="btn-atc"
          onClick={handleAddToCart}
          disabled={product.stock === 0}
        >
          {product.stock === 0 ? 'Sold Out' : 'Add to Bag'}
        </button>
      </div>

      <div className="prod-info">
        <div>
          <div className="prod-name">{product.name}</div>
          <div className="prod-cat">{product.cat}</div>
        </div>
        <div className="prod-price">{product.price.toLocaleString()} EGP</div>
      </div>
    </div>
  );
};

export default ProductCard;
