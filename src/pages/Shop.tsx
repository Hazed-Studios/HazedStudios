import React, { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCartStore, useNotificationStore } from '../context/store';
import { useNavigate } from 'react-router-dom';

interface ShopProps {
  onOpenCart: () => void;
}

const Shop: React.FC<ShopProps> = ({ onOpenCart }) => {
  const { products, loading } = useProducts();
  const { addToCart } = useCartStore();
  const { showNotif } = useNotificationStore();

  const [selectedColor, setSelectedColor] = useState<string>('Baby Blue');
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const navigate = useNavigate();

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
      quantity,
    });
    showNotif(`${thePolo.name} added to cart`);
    onOpenCart();
  };

  const handleBuyNow = () => {
    if (!thePolo) return;
    addToCart({
      id: thePolo.dbId,
      name: thePolo.name,
      price: thePolo.price,
      size: selectedSize,
      color: selectedColor,
      visual: selectedColor === 'Baby Blue' ? '/images/baby_blue_polo.jpg' : '/images/natural_linen_polo.jpg',
      quantity,
    });
    navigate('/checkout');
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
              <div className="sec-lbl">The Essential</div>
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

              <div className="spc-section">
                <div className="spc-label">Quantity</div>
                <div className="spc-options" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button style={{ border: '1px solid var(--bd)', background: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span style={{ fontSize: '16px' }}>{quantity}</span>
                  <button style={{ border: '1px solid var(--bd)', background: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }} onClick={() => setQuantity(quantity + 1)}>+</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', marginBottom: '40px' }}>
                <button className="sp-atc" onClick={handleAddToCart}>
                  Add to Cart
                </button>
                <button className="sp-atc" style={{ background: 'transparent', color: 'var(--dk)', border: '1px solid var(--dk)' }} onClick={handleBuyNow}>
                  Buy Now
                </button>
              </div>

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
