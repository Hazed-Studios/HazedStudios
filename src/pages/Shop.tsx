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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const navigate = useNavigate();

  // Get the first product (The Polo Linen Shirt)
  const thePolo = products[0];
  const images = thePolo?.gallery || (thePolo ? [thePolo.visual] : []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nextImage = () => setCurrentImageIndex((i) => (i + 1) % images.length);
  const prevImage = () => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEndEvent = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe) {
      nextImage();
    } else if (isRightSwipe) {
      prevImage();
    }
  };

  const handleAddToCart = () => {
    if (!thePolo) return;

    addToCart({
      id: thePolo.dbId,
      name: thePolo.name,
      price: thePolo.price,
      size: selectedSize,
      color: selectedColor,
      visual: thePolo.visual,
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
      visual: thePolo.visual,
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
            <div 
              style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto', overflow: 'hidden', borderRadius: '12px', boxShadow: '0 20px 40px rgba(26, 18, 8, .1)' }}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEndEvent}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  width: '100%', 
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)', 
                  transform: `translateX(-${currentImageIndex * 100}%)` 
                }}
              >
                {images.map((src: string, idx: number) => (
                  <img 
                    key={idx}
                    src={src} 
                    alt="The Polo Linen Shirt" 
                    className="sp-img" 
                    style={{ 
                      flex: '0 0 100%',
                      width: '100%', 
                      height: 'auto', 
                      objectFit: 'cover',
                      margin: 0,
                      boxShadow: 'none',
                      pointerEvents: 'none' // Prevent dragging image which interferes with swipe
                    }} 
                  />
                ))}
              </div>
              {images.length > 1 && (
                <>
                  <button 
                    className="desktop-arrow"
                    onClick={prevImage}
                    style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(250, 246, 240, 0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: 'var(--dk)', fontSize: '16px', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10 }}
                  >
                    ←
                  </button>
                  <button 
                    className="desktop-arrow"
                    onClick={nextImage}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(250, 246, 240, 0.8)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: 'var(--dk)', fontSize: '16px', transition: 'all 0.3s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', zIndex: 10 }}
                  >
                    →
                  </button>
                  <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                    {images.map((_: any, idx: number) => (
                      <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === currentImageIndex ? 'var(--cr)' : 'rgba(192, 127, 69, 0.4)', transition: 'all 0.3s' }} />
                    ))}
                  </div>
                </>
              )}
            </div>
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
