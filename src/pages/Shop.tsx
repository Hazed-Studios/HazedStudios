import React, { useEffect, useState } from 'react';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/product/ProductCard';
import FilterDrawer from '../components/shared/FilterDrawer';
import { useNavigate } from 'react-router-dom';

interface ShopProps {
  onOpenCart: () => void;
}

const Shop: React.FC<ShopProps> = () => {
  const { products, loading } = useProducts();
  const navigate = useNavigate();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [sortValue, setSortValue] = useState('Featured');

  const [inStock, setInStock] = useState(false);
  const [minPrice, setMinPrice] = useState('0.00');
  const [maxPrice, setMaxPrice] = useState('1600.00');

  const filteredProducts = React.useMemo(() => {
    let result = [...products];

    if (inStock) {
      result = result.filter(p => p.stock > 0);
    }

    const min = parseFloat(minPrice) || 0;
    const max = parseFloat(maxPrice) || 1600;
    result = result.filter(p => p.price >= min && p.price <= max);

    if (sortValue === 'PriceLowToHigh') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortValue === 'PriceHighToLow') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [products, inStock, minPrice, maxPrice, sortValue]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="shop-wrapper" style={{ paddingTop: '120px', paddingBottom: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header section to match screenshot */}
      <div style={{ textAlign: 'center', marginBottom: '50px' }}>
        <h1 className="shop-title-main">
          <span>Summer Collection</span><br />
          2026
        </h1>
      </div>

      {/* Toolbar */}
      <div className="shop-toolbar">
        <div className="shop-toolbar-filter" onClick={() => setIsFilterOpen(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
          <span className="hide-on-mobile">FILTER AND SORT</span>
          <span className="show-on-mobile">FILTER</span>
        </div>

        <div className="shop-toolbar-sort" style={{ position: 'relative' }}>
          <div
            className="toolbar-select"
            onClick={() => setIsSortOpen(!isSortOpen)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: 0 }}
          >
            {sortValue === 'PriceLowToHigh' ? 'PRICE: LOW TO HIGH' : sortValue === 'PriceHighToLow' ? 'PRICE: HIGH TO LOW' : 'FEATURED'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isSortOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          {isSortOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                onClick={() => setIsSortOpen(false)}
              />
              <div className="custom-dropdown-menu">
                <div className="custom-dropdown-item" onClick={() => { setSortValue('PriceLowToHigh'); setIsSortOpen(false); }}>PRICE: LOW TO HIGH</div>
                <div className="custom-dropdown-item" onClick={() => { setSortValue('PriceHighToLow'); setIsSortOpen(false); }}>PRICE: HIGH TO LOW</div>
              </div>
            </>
          )}
        </div>

        <span className="shop-toolbar-count">{filteredProducts.length}&nbsp;PRODUCTS</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: 'var(--mu)', marginTop: '60px', letterSpacing: '0.2em', fontSize: '12px' }}>CURATING...</div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--mu)', marginTop: '80px', marginBottom: '120px', fontSize: '18px', fontStyle: 'italic', fontFamily: '"Cormorant Garamond", serif', letterSpacing: '0.05em' }}>
          We currently have no pieces available matching your selected criteria.
        </div>
      ) : (
        <div className="plp-grid">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={(p) => navigate(`/product/${p.id}`)}
            />
          ))}
        </div>
      )}

      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        productCount={filteredProducts.length}
        inStock={inStock}
        setInStock={setInStock}
        minPrice={minPrice}
        setMinPrice={setMinPrice}
        maxPrice={maxPrice}
        setMaxPrice={setMaxPrice}
        sortBy={sortValue}
        setSortBy={setSortValue}
      />
    </div>
  );
};

export default Shop;
