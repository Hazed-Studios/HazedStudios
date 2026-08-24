import React, { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import { useCartStore, useNotificationStore } from '../context/store';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { track } from '@vercel/analytics/react';

interface ShopProps {
  onOpenCart: () => void;
}

const ProductDetails: React.FC<ShopProps> = ({ onOpenCart }) => {
  const { products, loading } = useProducts();
  const { addToCart } = useCartStore();
  const { showNotif } = useNotificationStore();

  const colorMap: Record<string, string> = {
    'Baby Blue': '#a4c2d3',
    'Natural Linen': '#e3dac9'
  };

  const { id } = useParams<{ id: string }>();
  const initialProduct = products.find(p => String(p.id) === id);
  const initialColor = initialProduct?.name.includes('Baby Blue') ? 'Baby Blue' : 'Natural Linen';
  
  const [selectedColor, setSelectedColor] = useState<string>(initialColor);

  useEffect(() => {
    if (initialColor) {
      setSelectedColor(initialColor);
    }
  }, [initialColor]);
  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);
  const [totalStockLeft, setTotalStockLeft] = useState<number | null>(null);
  const [showSizeChart, setShowSizeChart] = useState(false);
  const navigate = useNavigate();

  // Find the product matching the selected color (each color is a separate DB row)
  const thePolo = products.find((p) => p.name.includes(selectedColor)) || products[0];
  const images = thePolo?.gallery || (thePolo ? [thePolo.visual] : []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!thePolo) return;
    setTotalStockLeft(thePolo.stock);
  }, [thePolo]);

  const nextImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((i) => (i + 1) % images.length);
  };
  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((i) => (i - 1 + images.length) % images.length);
  };

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
      oldPrice: thePolo.oldPrice,
      size: selectedSize,
      color: selectedColor,
      visual: thePolo.visual,
      quantity,
    });
    showNotif(`${thePolo.name} added to cart`);
    track('Add to Cart');
    onOpenCart();
  };

  const handleBuyNow = () => {
    if (!thePolo) return;
    addToCart({
      id: thePolo.dbId,
      name: thePolo.name,
      price: thePolo.price,
      oldPrice: thePolo.oldPrice,
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
              className="sp-img-container"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEndEvent}
              onClick={() => setIsZoomed(true)}
              style={{ cursor: 'zoom-in' }}
            >
              <div 
                style={{ 
                  display: 'flex', 
                  width: '100%', 
                  height: '100%',
                  transition: 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)', 
                  transform: `translateX(-${currentImageIndex * 100}%)` 
                }}
              >
                {images.map((src: string, idx: number) => (
                  <img 
                    key={idx}
                    src={src} 
                    alt={`The Polo Linen Shirt - view ${idx + 1}`} 
                    width={1200}
                    height={1600}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    className="sp-img" 
                    style={{ 
                      flex: '0 0 100%',
                      width: '100%', 
                      height: '100%', 
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
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg)', backdropFilter: 'blur(4px)', border: '1px solid var(--bd)', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dk)', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', boxShadow: '0 4px 14px rgba(26,18,8,0.08)', zIndex: 10 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cr)'; e.currentTarget.style.color = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--cr)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--dk)'; e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                  >
                    <ChevronLeft size={22} strokeWidth={1.5} />
                  </button>
                  <button 
                    className="desktop-arrow"
                    onClick={nextImage}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg)', backdropFilter: 'blur(4px)', border: '1px solid var(--bd)', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dk)', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', boxShadow: '0 4px 14px rgba(26,18,8,0.08)', zIndex: 10 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cr)'; e.currentTarget.style.color = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--cr)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--dk)'; e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                  >
                    <ChevronRight size={22} strokeWidth={1.5} />
                  </button>
                  <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 10 }}>
                    {images.map((_: any, idx: number) => (
                      <div key={idx} style={{ width: '8px', height: '8px', borderRadius: '50%', background: idx === currentImageIndex ? 'var(--dk)' : 'var(--mu2)', transition: 'all 0.3s' }} />
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
              <div className="sp-price" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                {thePolo.oldPrice ? (
                  <>
                    <span style={{ textDecoration: 'line-through', color: 'var(--mu2)', fontSize: '0.9em', whiteSpace: 'nowrap' }}>
                      {thePolo.oldPrice.toLocaleString()} EGP
                    </span>
                    <span style={{ color: 'var(--cr)', display: 'inline-flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
                      {thePolo.price.toLocaleString()} EGP
                      <span style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        fontSize: '11px', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        color: 'var(--bg)', 
                        background: 'var(--cr)', 
                        padding: '4px 8px', 
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>
                        Limited Time
                      </span>
                    </span>
                  </>
                ) : (
                  <>{thePolo.price.toLocaleString()} EGP</>
                )}
              </div>
              {totalStockLeft !== null && totalStockLeft <= 10 && totalStockLeft > 0 && (
                <div style={{ color: 'var(--cr)', fontSize: '13px', fontWeight: 500, fontStyle: 'italic', marginTop: '4px' }}>
                  Only {totalStockLeft} pieces left
                </div>
              )}


              <div className="sp-desc">
                {thePolo.story}
              </div>

              <div className="spc-section">
                <div className="spc-label">
                  Color - <span style={{ color: 'var(--dk)', fontWeight: 500 }}>{selectedColor}</span>
                </div>
                <div className="spc-options" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                  {['Natural Linen', 'Baby Blue'].map(c => (
                    <button
                      key={c}
                      onClick={() => {
                        setSelectedColor(c);
                        if (window.innerWidth <= 768) {
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: colorMap[c],
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
                        outline: 'none',
                        boxShadow: selectedColor === c 
                          ? '0 0 0 2px var(--bg), 0 0 0 4px var(--cr)' 
                          : 'inset 0 0 0 1px rgba(0,0,0,0.1)'
                      }}
                      title={c}
                      aria-label={c}
                    />
                  ))}
                </div>
              </div>

              <div className="spc-section">
                <div className="spc-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Size</span>
                  <button 
                    onClick={() => setShowSizeChart(true)} 
                    style={{ background: 'none', border: 'none', color: 'var(--mu)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                  >
                    Size Guide
                  </button>
                </div>
                <div className="spc-options">
                  {['S', 'M', 'L'].map(s => {
                    const isOk = thePolo ? (thePolo.sizeStock[s] || 0) > 0 : true;
                    return (
                      <button
                        key={s}
                        className={`spc-btn ${selectedSize === s ? 'on' : ''} ${!isOk ? 'out-of-stock' : ''}`}
                        style={{ opacity: isOk ? 1 : 0.4, cursor: isOk ? 'pointer' : 'not-allowed' }}
                        onClick={() => isOk && setSelectedSize(s)}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="spc-section">
                <div className="spc-label">Quantity</div>
                <div className="spc-options" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <button style={{ border: '1px solid var(--bd)', background: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                  <span style={{ fontSize: '16px' }}>{quantity}</span>
                  <button 
                    style={{ border: '1px solid var(--bd)', background: 'none', cursor: (thePolo && quantity >= (thePolo.sizeStock[selectedSize] || 0)) ? 'not-allowed' : 'pointer', opacity: (thePolo && quantity >= (thePolo.sizeStock[selectedSize] || 0)) ? 0.5 : 1, padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }} 
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={thePolo && quantity >= (thePolo.sizeStock[selectedSize] || 0)}
                  >+</button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', marginBottom: '24px' }}>
                <button 
                  className="sp-atc" 
                  onClick={handleAddToCart}
                  disabled={!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0}
                  style={{ opacity: (!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0) ? 0.5 : 1, cursor: (!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0) ? 'not-allowed' : 'pointer' }}
                >
                  {(!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0) ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <button 
                  className="sp-atc" 
                  style={{ background: 'transparent', color: 'var(--dk)', border: '1px solid var(--dk)', opacity: (!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0) ? 0.5 : 1, cursor: (!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0) ? 'not-allowed' : 'pointer' }} 
                  onClick={handleBuyNow}
                  disabled={!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0}
                >
                  Buy Now
                </button>
              </div>

              <div className="sp-model-info">
                <div><strong>First model:</strong> 179 cm, 70 kg, wearing size M in Natural Linen.</div>
                <div style={{ marginTop: '8px' }}><strong>Second model:</strong> 170 cm, 60 kg, wearing size M in Baby Blue.</div>
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

      {isZoomed && (
        <div 
          style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(250, 246, 240, 0.98)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
          onClick={() => setIsZoomed(false)}
        >
          <img 
            src={images[currentImageIndex]} 
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain', borderRadius: '4px', boxShadow: '0 20px 40px rgba(26, 18, 8, .1)' }} 
            alt="Zoomed product" 
          />
          <button style={{ position: 'absolute', top: '24px', right: '32px', background: 'none', border: 'none', fontSize: '40px', fontWeight: 300, color: 'var(--dk)', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowSizeChart(false)}>
          <div style={{ position: 'relative', width: '90%', maxWidth: '600px', background: 'var(--bg)', padding: '16px', borderRadius: '8px' }} onClick={(e) => e.stopPropagation()}>
            <button style={{ position: 'absolute', top: '16px', right: '16px', background: 'var(--cr)', color: 'var(--bg)', border: 'none', width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }} onClick={() => setShowSizeChart(false)}>×</button>
            <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 600, color: 'var(--dk)' }}>Size Guide</h3>
            <img src={`${import.meta.env.BASE_URL}images/sizechart.png`} alt="Size Chart" style={{ width: '100%', height: 'auto', display: 'block' }} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
