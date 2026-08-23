import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts } from '../../hooks/useProducts';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const { products } = useProducts();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset query when closed, focus when opened
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
    } else {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen]);

  const filteredProducts = query
    ? products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleProductClick = (productId: string | number) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  return (
    <div className={`search-ov ${isOpen ? 'open' : ''}`}>
      <button className="search-x" onClick={onClose}>×</button>
      <div className="search-lbl">Search Item</div>
      <input
        ref={inputRef}
        className="search-inp"
        placeholder="Type a product name..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      
      {query && (
        <div className="search-res">
          {filteredProducts.length > 0 ? (
            filteredProducts.map(p => (
              <div key={p.id} className="sri" onClick={() => handleProductClick(p.id)} style={{ display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left' }}>
                {(p.visual && (p.visual.includes('images/') || p.visual.startsWith('http'))) ? (
                  <img src={p.visual} alt={p.name} style={{ width: '48px', height: '60px', objectFit: 'cover', borderRadius: '4px' }} />
                ) : (
                  <div style={{ width: '48px', height: '60px', background: 'var(--bd)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>{p.visual || 'H.S'}</div>
                )}
                <div>
                  <div className="sri-name">{p.name}</div>
                  <div className="sri-price">{p.price.toLocaleString()} EGP</div>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: 'var(--mu)', marginTop: '20px', fontSize: '14px' }}>No products found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchOverlay;
