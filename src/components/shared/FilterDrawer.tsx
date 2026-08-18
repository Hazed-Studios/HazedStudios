import React, { useState, useRef, useEffect, useCallback } from 'react';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  productCount: number;
  inStock: boolean;
  setInStock: (val: boolean) => void;
  minPrice: string;
  setMinPrice: (val: string) => void;
  maxPrice: string;
  setMaxPrice: (val: string) => void;
  sortBy: string;
  setSortBy: (val: string) => void;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ 
  isOpen, onClose, productCount,
  inStock, setInStock,
  minPrice, setMinPrice,
  maxPrice, setMaxPrice,
  sortBy, setSortBy
}) => {
  
  const rangeWrapRef = useRef<HTMLDivElement>(null);
  const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null);

  const maxPossiblePrice = 1600;

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!activeThumb || !rangeWrapRef.current) return;
    
    const rect = rangeWrapRef.current.getBoundingClientRect();
    let newPercent = ((e.clientX - rect.left) / rect.width) * 100;
    newPercent = Math.max(0, Math.min(100, newPercent));
    
    let newValue = (newPercent / 100) * maxPossiblePrice;
    
    if (activeThumb === 'min') {
      newValue = Math.min(newValue, parseFloat(maxPrice) - 1);
      setMinPrice(newValue.toFixed(2));
    } else {
      newValue = Math.max(newValue, parseFloat(minPrice) + 1);
      setMaxPrice(newValue.toFixed(2));
    }
  }, [activeThumb, minPrice, maxPrice, maxPossiblePrice]);

  const handlePointerUp = useCallback(() => {
    setActiveThumb(null);
  }, []);

  useEffect(() => {
    if (activeThumb) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeThumb, handlePointerMove, handlePointerUp]);

  const minPercent = (parseFloat(minPrice || '0') / maxPossiblePrice) * 100;
  const maxPercent = (parseFloat(maxPrice || '1600') / maxPossiblePrice) * 100;

  return (
    <>
      <div className={`filter-ov ${isOpen ? 'show' : ''}`} onClick={onClose} />
      <div className={`filter-drawer ${isOpen ? 'open' : ''}`}>
        
        <div className="filter-head">
          <div className="fh-title">
            <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>FILTER AND SORT</span>
            <span style={{ fontSize: '10px', color: 'var(--mu)', marginTop: '4px', display: 'block' }}>
              {productCount} PRODUCTS
            </span>
          </div>
          <button className="cart-x" onClick={onClose}>×</button>
        </div>

        <div className="filter-body">
          {/* Availability */}
          <div className="filter-sec">
            <div className="filter-sec-title">
              <span className="fs-minus">-</span> AVAILABILITY
            </div>
            <div className="filter-sec-content">
              <label className="filter-toggle">
                <input 
                  type="checkbox" 
                  checked={inStock} 
                  onChange={(e) => setInStock(e.target.checked)} 
                />
                <span className="ft-slider"></span>
                <span className="ft-label">In stock</span>
              </label>
            </div>
          </div>

          <hr className="filter-div" />

          {/* Price */}
          <div className="filter-sec">
            <div className="filter-sec-title">
              <span className="fs-minus">-</span> PRICE
            </div>
            <div className="filter-sec-content">
              <div className="fs-desc">
                The highest price is LE {maxPossiblePrice.toFixed(2)}
              </div>
              
              {/* Range visual representation */}
              <div className="fs-range-wrap" ref={rangeWrapRef}>
                <div className="fs-range-track">
                  <div className="fs-range-fill" style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}></div>
                </div>
                <div 
                  className="fs-range-thumb" 
                  style={{ left: `${minPercent}%`, touchAction: 'none' }}
                  onPointerDown={(e) => { e.preventDefault(); setActiveThumb('min'); }}
                >
                  <div className="fs-thumb-inner">||</div>
                </div>
                <div 
                  className="fs-range-thumb" 
                  style={{ left: `${maxPercent}%`, touchAction: 'none' }}
                  onPointerDown={(e) => { e.preventDefault(); setActiveThumb('max'); }}
                >
                  <div className="fs-thumb-inner">||</div>
                </div>
              </div>

              {/* Min/Max Inputs */}
              <div className="fs-inputs">
                <div className="fs-input-group">
                  <span className="fs-currency">ج.م</span>
                  <input 
                    type="number" 
                    value={minPrice} 
                    onChange={(e) => setMinPrice(e.target.value)} 
                    placeholder="0.00" 
                  />
                </div>
                <div className="fs-input-group">
                  <span className="fs-currency">ج.م</span>
                  <input 
                    type="number" 
                    value={maxPrice} 
                    onChange={(e) => setMaxPrice(e.target.value)} 
                    placeholder="1600.00" 
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="filter-div" />

          {/* Sort By */}
          <div className="filter-sec sort-sec">
            <div className="filter-sec-title no-pad">
              SORT BY
            </div>
            <div className="filter-dropdown">
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="PriceLowToHigh">Price: Low to High</option>
                <option value="PriceHighToLow">Price: High to Low</option>
              </select>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="filter-foot">
          <button className="ff-clear" onClick={() => {
            setInStock(false);
            setMinPrice('0.00');
            setMaxPrice('1600.00');
            setSortBy('Featured');
          }}>
            CLEAR
          </button>
          <button className="ff-apply" onClick={onClose}>
            APPLY
          </button>
        </div>

      </div>
    </>
  );
};

export default FilterDrawer;
