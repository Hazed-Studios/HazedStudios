import React, { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCartStore, useNotificationStore } from '../context/store';

interface ShopProps {
  onOpenCart: () => void;
}

const Shop: React.FC<ShopProps> = ({ onOpenCart }) => {
  const { products, loading } = useProducts();
  const { addToCart } = useCartStore();
  const { showNotif } = useNotificationStore();

  const [selectedColor, setSelectedColor] = useState<string>('Baby Blue');
  const [selectedSize, setSelectedSize] = useState<string>('M');

  // Get the first product (The Polo Linen Shirt)
  const thePolo = products[0];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleAddToCart = () => {
    if (!thePolo) return;

    addToCart({
      id: thePolo.dbId,
      name: thePolo.name,
      price: thePolo.price,
      size: selectedSize,
      color: selectedColor,
      visual: selectedColor === 'Baby Blue' ? '/images/baby_blue_polo.jpg' : '/images/natural_linen_polo.jpg',
    });
    showNotif(`${thePolo.name} added to bag`);
    onOpenCart();
  };

  return (
    <div className="shop-wrapper" style={{ paddingTop: '130px' }}>
      <section id="the-polo" className="sp-sec">
        <div className="sp-left">
          {loading ? (
            <div style={{ color: 'var(--mu)', fontSize: '11px', letterSpacing: '.2em' }}>CURATING...</div>
          ) : (
            <img src={thePolo?.visual} alt="The Polo Linen Shirt" className="sp-img" />
          )}
        </div>

        <div className="sp-right">
          {loading ? (
            <div style={{ color: 'var(--mu)', fontSize: '15px' }}>Loading piece details...</div>
          ) : thePolo && (
            <>
              <div className="sec-lbl">Drop 01</div>
              <h2 className="sp-title">The Polo Linen Shirt</h2>
              <div className="sp-price">{thePolo.price.toLocaleString()} EGP</div>

              <div className="sp-desc">
                {thePolo.story}
              </div>

              <div className="spc-section">
                <div className="spc-label">Color</div>
                <div className="spc-options">
                  {['Baby Blue', 'Natural Linen'].map(c => (
                    <button
                      key={c}
                      className={`spc-btn ${selectedColor === c ? 'on' : ''}`}
                      onClick={() => setSelectedColor(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="spc-section">
                <div className="spc-label">Size</div>
                <div className="spc-options">
                  {['S', 'M', 'L'].map(s => (
                    <button
                      key={s}
                      className={`spc-btn ${selectedSize === s ? 'on' : ''}`}
                      onClick={() => setSelectedSize(s)}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button className="sp-atc" onClick={handleAddToCart}>
                Add to Bag
              </button>

              <div className="sp-details">
                <ul>
                  {thePolo.details.map((d, i) => <li key={i}>{d}</li>)}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default Shop;
