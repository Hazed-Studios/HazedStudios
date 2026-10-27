import React, { useEffect, useState, useRef } from 'react';
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
  const { addToCart, addMultipleToCart } = useCartStore();
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

  // Bundle & Save state
  type BundleTier = 1 | 2 | 3;
  const [bundleTier, setBundleTier] = useState<BundleTier>(2); // Default to Buy 2 (Most Popular!)

  interface PieceConfig {
    color: string;
    size: string;
  }

  // Pre-loaded so both colors are included in the bundle by default!
  const [bundlePieces, setBundlePieces] = useState<PieceConfig[]>([
    { color: 'Natural Linen', size: 'M' },
    { color: 'Baby Blue', size: 'M' },
    { color: 'Natural Linen', size: 'M' }
  ]);

  const [selectedSize, setSelectedSize] = useState<string>('M');
  const [quantity, setQuantity] = useState<number>(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<number | null>(null);
  const touchEndRef = useRef<number | null>(null);
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
    setCurrentImageIndex((i) => (i < images.length - 1 ? i + 1 : i));
  };
  const prevImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentImageIndex((i) => (i > 0 ? i - 1 : i));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.targetTouches[0].clientX;
    touchEndRef.current = null;
    if (carouselRef.current) {
      carouselRef.current.style.transition = 'none';
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const currentX = e.targetTouches[0].clientX;
    touchEndRef.current = currentX;

    const offset = currentX - touchStartRef.current;
    if (carouselRef.current) {
      carouselRef.current.style.transform = `translateX(calc(-${currentImageIndex * 100}% + ${offset}px))`;
    }
  };

  const onTouchEndEvent = () => {
    if (touchStartRef.current === null || touchEndRef.current === null) {
      if (carouselRef.current) {
        carouselRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
        carouselRef.current.style.transform = `translateX(-${currentImageIndex * 100}%)`;
      }
      touchStartRef.current = null;
      touchEndRef.current = null;
      return;
    }

    const distance = touchStartRef.current - touchEndRef.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (carouselRef.current) {
      carouselRef.current.style.transition = 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)';
      const nextIndex = (isLeftSwipe && currentImageIndex < images.length - 1) ? currentImageIndex + 1 : (isRightSwipe && currentImageIndex > 0) ? currentImageIndex - 1 : currentImageIndex;
      carouselRef.current.style.transform = `translateX(-${nextIndex * 100}%)`;
    }

    if (isLeftSwipe && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(i => i + 1);
    } else if (isRightSwipe && currentImageIndex > 0) {
      setCurrentImageIndex(i => i - 1);
    }

    touchStartRef.current = null;
    touchEndRef.current = null;
  };

  const isOutOfStock = bundleTier === 1
    ? (!thePolo || (thePolo.sizeStock[selectedSize] || 0) === 0)
    : bundlePieces.slice(0, bundleTier).some(piece => {
        const prod = products.find(p => p.name.includes(piece.color)) || thePolo;
        return !prod || (prod.sizeStock[piece.size] || 0) <= 0;
      });

  const handleAddToCart = () => {
    if (bundleTier === 1) {
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
    } else {
      const itemsToAdd = bundlePieces.slice(0, bundleTier).map(piece => {
        const prod = products.find(p => p.name.includes(piece.color)) || thePolo;
        return {
          id: prod.dbId,
          name: prod.name,
          price: prod.price,
          oldPrice: prod.oldPrice,
          size: piece.size,
          color: piece.color,
          visual: prod.visual,
          quantity: 1,
        };
      });
      addMultipleToCart(itemsToAdd);
      const savingsMsg = bundleTier === 2 ? 'Save 1,200 EGP!' : 'Save 1,950 EGP!';
      showNotif(`Bundle added to cart (${bundleTier} pieces • ${savingsMsg})`);
    }
    track('Add to Cart');
    onOpenCart();
  };

  const handleBuyNow = () => {
    if (bundleTier === 1) {
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
    } else {
      const itemsToAdd = bundlePieces.slice(0, bundleTier).map(piece => {
        const prod = products.find(p => p.name.includes(piece.color)) || thePolo;
        return {
          id: prod.dbId,
          name: prod.name,
          price: prod.price,
          oldPrice: prod.oldPrice,
          size: piece.size,
          color: piece.color,
          visual: prod.visual,
          quantity: 1,
        };
      });
      addMultipleToCart(itemsToAdd);
    }
    navigate('/checkout');
  };

  const getButtonPrice = () => {
    if (bundleTier === 1) return (700 * quantity).toLocaleString();
    if (bundleTier === 2) return '1,200';
    return '1,650';
  };

  const getSavingsText = () => {
    if (bundleTier === 1) return 'Save 500 EGP vs original 1,200 EGP';
    if (bundleTier === 2) return 'Save 1,200 EGP instead of 1,400 (was 2,400 EGP)';
    return 'Save 1,950 EGP instead of 2,100 (was 3,600 EGP)';
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
                ref={carouselRef}
                style={{
                  display: 'flex',
                  width: '100%',
                  height: '100%',
                  transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
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
                    style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg)', backdropFilter: 'blur(4px)', border: '1px solid var(--bd)', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: currentImageIndex > 0 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', color: 'var(--dk)', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', boxShadow: '0 4px 14px rgba(26,18,8,0.08)', zIndex: 10 }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--cr)'; e.currentTarget.style.color = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--cr)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--dk)'; e.currentTarget.style.borderColor = 'var(--bd)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
                  >
                    <ChevronLeft size={22} strokeWidth={1.5} />
                  </button>
                  <button
                    className="desktop-arrow"
                    onClick={nextImage}
                    style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'var(--bg)', backdropFilter: 'blur(4px)', border: '1px solid var(--bd)', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', display: currentImageIndex < images.length - 1 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center', color: 'var(--dk)', transition: 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)', boxShadow: '0 4px 14px rgba(26,18,8,0.08)', zIndex: 10 }}
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
                        SALE
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


              <div className="sp-desc" style={{ marginTop: '20px' }}>
                {thePolo.story}
              </div>

              {/* BUNDLE & SAVE SECTION */}
              <div style={{ marginTop: '24px', marginBottom: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--cr)' }}>
                    Bundle & Save Offers
                  </div>
                  <span style={{
                    fontSize: '10px',
                    background: 'var(--cr)',
                    color: 'var(--bg)',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase'
                  }}>
                    Save up to 1,950 EGP
                  </span>
                </div>

                {/* 3 Tier Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {/* Tier 1: Single */}
                  <div
                    onClick={() => setBundleTier(1)}
                    style={{
                      border: bundleTier === 1 ? '2px solid var(--cr)' : '1px solid var(--bd)',
                      background: bundleTier === 1 ? 'rgba(192, 127, 69, 0.06)' : 'var(--bg)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: bundleTier === 1 ? '5px solid var(--cr)' : '2px solid var(--bd)',
                        background: 'var(--bg)',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dk)' }}>
                          1 Piece — Single Shirt
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--mu)', marginTop: '2px' }}>
                          Standard sale price
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--mu2)', fontSize: '12px' }}>1,200 EGP</span>
                        <span style={{ fontWeight: 700, color: 'var(--dk)', fontSize: '15px' }}>700 EGP</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--cr)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Save 500 EGP
                      </span>
                    </div>
                  </div>

                  {/* Tier 2: Buy 2 for 1,200 EGP */}
                  <div
                    onClick={() => setBundleTier(2)}
                    style={{
                      position: 'relative',
                      border: bundleTier === 2 ? '2px solid var(--cr)' : '1px solid var(--bd)',
                      background: bundleTier === 2 ? 'rgba(192, 127, 69, 0.08)' : 'var(--bg)',
                      borderRadius: '10px',
                      padding: '14px 14px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-9px',
                      right: '14px',
                      background: 'var(--cr)',
                      color: 'var(--bg)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      boxShadow: '0 2px 6px rgba(192, 127, 69, 0.3)'
                    }}>
                      ★ MOST POPULAR • SAVE 1,200 EGP
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: bundleTier === 2 ? '5px solid var(--cr)' : '2px solid var(--bd)',
                        background: 'var(--bg)',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dk)' }}>
                          Buy 2 for 1,200 EGP
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--cr)', fontWeight: 600, marginTop: '2px' }}>
                          Both colors included (1 Natural + 1 Blue)
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--mu2)', fontSize: '12px' }}>1,400 EGP</span>
                        <span style={{ fontWeight: 700, color: 'var(--cr)', fontSize: '16px' }}>1,200 EGP</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--cr)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        SAVE 1,200 EGP vs Original
                      </span>
                    </div>
                  </div>

                  {/* Tier 3: Buy 3 for 1,650 EGP */}
                  <div
                    onClick={() => setBundleTier(3)}
                    style={{
                      position: 'relative',
                      border: bundleTier === 3 ? '2px solid var(--cr)' : '1px solid var(--bd)',
                      background: bundleTier === 3 ? 'rgba(192, 127, 69, 0.08)' : 'var(--bg)',
                      borderRadius: '10px',
                      padding: '14px 14px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span style={{
                      position: 'absolute',
                      top: '-9px',
                      right: '14px',
                      background: 'var(--dk)',
                      color: 'var(--bg)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '2px 8px',
                      borderRadius: '10px'
                    }}>
                      👑 BEST VALUE • SAVE 1,950 EGP
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        border: bundleTier === 3 ? '5px solid var(--cr)' : '2px solid var(--bd)',
                        background: 'var(--bg)',
                        flexShrink: 0
                      }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--dk)' }}>
                          Buy 3 for 1,650 EGP
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--dk)', fontWeight: 500, marginTop: '2px' }}>
                          Ultimate bundle • 550 EGP / piece
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--mu2)', fontSize: '12px' }}>2,100 EGP</span>
                        <span style={{ fontWeight: 700, color: 'var(--cr)', fontSize: '16px' }}>1,650 EGP</span>
                      </div>
                      <span style={{ fontSize: '10px', color: 'var(--cr)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        SAVE 1,950 EGP vs Original
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* PIECE CUSTOMIZATION SECTION */}
              {bundleTier === 1 ? (
                <>
                  <div className="spc-section">
                    <div className="spc-label">
                      Color - <span style={{ color: 'var(--dk)', fontWeight: 500 }}>{selectedColor}</span>
                    </div>
                    <div className="spc-options" style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      {['Natural Linen', 'Baby Blue'].map(c => (
                        <button
                          key={c}
                          type="button"
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
                        type="button"
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
                            type="button"
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
                      <button type="button" style={{ border: '1px solid var(--bd)', background: 'none', cursor: 'pointer', padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }} onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                      <span style={{ fontSize: '16px' }}>{quantity}</span>
                      <button
                        type="button"
                        style={{ border: '1px solid var(--bd)', background: 'none', cursor: (thePolo && quantity >= (thePolo.sizeStock[selectedSize] || 0)) ? 'not-allowed' : 'pointer', opacity: (thePolo && quantity >= (thePolo.sizeStock[selectedSize] || 0)) ? 0.5 : 1, padding: '8px 16px', borderRadius: '4px', fontSize: '16px', color: 'var(--dk)' }}
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={thePolo && quantity >= (thePolo.sizeStock[selectedSize] || 0)}
                      >+</button>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dk)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                      Configure Your {bundleTier} Pieces
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSizeChart(true)}
                      style={{ background: 'none', border: 'none', color: 'var(--mu)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '.1em', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                    >
                      Size Guide
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {Array.from({ length: bundleTier }).map((_, idx) => {
                      const piece = bundlePieces[idx];
                      const pieceProd = products.find(p => p.name.includes(piece.color)) || thePolo;
                      return (
                        <div
                          key={idx}
                          style={{
                            padding: '12px 14px',
                            background: 'var(--bg)',
                            border: '1px solid var(--bd)',
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(26,18,8,0.02)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--dk)', letterSpacing: '.04em' }}>
                              Piece #{idx + 1}: <span style={{ color: 'var(--cr)' }}>{piece.color}</span>
                            </span>
                            <span style={{ fontSize: '11px', color: 'var(--mu)', fontStyle: 'italic' }}>
                              Size: {piece.size}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
                            {/* Color options */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {['Natural Linen', 'Baby Blue'].map(c => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => {
                                    const next = [...bundlePieces];
                                    next[idx].color = c;
                                    setBundlePieces(next);
                                    setSelectedColor(c); // Update gallery preview
                                  }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 9px',
                                    borderRadius: '6px',
                                    border: piece.color === c ? '1.5px solid var(--cr)' : '1px solid var(--bd)',
                                    background: piece.color === c ? 'rgba(192, 127, 69, 0.08)' : 'transparent',
                                    cursor: 'pointer',
                                    fontSize: '11.5px',
                                    color: 'var(--dk)',
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: colorMap[c], border: '1px solid rgba(0,0,0,0.1)' }} />
                                  {c === 'Natural Linen' ? 'Natural Linen' : 'Baby Blue'}
                                </button>
                              ))}
                            </div>

                            {/* Size buttons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {['S', 'M', 'L'].map(s => {
                                const isOk = pieceProd ? (pieceProd.sizeStock[s] || 0) > 0 : true;
                                return (
                                  <button
                                    key={s}
                                    type="button"
                                    className={`spc-btn ${piece.size === s ? 'on' : ''}`}
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      minWidth: '32px',
                                      fontSize: '12px',
                                      padding: 0,
                                      opacity: isOk ? 1 : 0.35,
                                      cursor: isOk ? 'pointer' : 'not-allowed'
                                    }}
                                    onClick={() => {
                                      if (isOk) {
                                        const next = [...bundlePieces];
                                        next[idx].size = s;
                                        setBundlePieces(next);
                                      }
                                    }}
                                  >
                                    {s}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', marginBottom: '20px' }}>
                <button
                  className="sp-atc"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{ opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                >
                  {isOutOfStock
                    ? 'One or more items out of stock'
                    : bundleTier === 1
                    ? `Add to Cart — ${getButtonPrice()} EGP`
                    : `Add ${bundleTier}-Piece Bundle to Cart — ${getButtonPrice()} EGP`}
                </button>
                <button
                  className="sp-atc"
                  style={{ background: 'transparent', color: 'var(--dk)', border: '1px solid var(--dk)', opacity: isOutOfStock ? 0.5 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                >
                  {isOutOfStock
                    ? 'One or more items out of stock'
                    : bundleTier === 1
                    ? `Buy Now — ${getButtonPrice()} EGP`
                    : `Buy ${bundleTier}-Piece Bundle Now — ${getButtonPrice()} EGP`}
                </button>
                <div style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--cr)', fontWeight: 600, letterSpacing: '.03em', marginTop: '2px' }}>
                  ✓ {getSavingsText()}
                </div>
              </div>

              <div className="sp-model-info">
                <div><strong>The Model:</strong> 179 cm | 70 kg | Wearing size M</div>
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
