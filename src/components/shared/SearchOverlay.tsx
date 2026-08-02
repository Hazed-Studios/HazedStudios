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

  const handleProductClick = () => {
    onClose();
    navigate('/shop');
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
              <div key={p.id} className="sri" onClick={() => handleProductClick()}>
                <div className="sri-name">{p.name}</div>
                <div className="sri-price">{p.price.toLocaleString()} EGP</div>
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
