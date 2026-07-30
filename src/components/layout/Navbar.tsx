import React, { useState, useEffect } from 'react';
import { useCartStore } from '../../context/store';
import { Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  onOpenCart: () => void;
  onOpenSearch: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenCart, onOpenSearch }) => {
  const { cart } = useCartStore();
  const [scrolled, setScrolled] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav style={{ 
      borderBottom: scrolled ? '1px solid var(--bd)' : 'none',
      backgroundColor: scrolled ? 'var(--bg)' : 'transparent',
      transition: 'background-color 0.3s ease, border-bottom 0.3s ease'
    }}>
      <div className="ann">
        <span>Free Shipping over 2400 EGP</span>
        <span className="ann-sep">|</span>
        <span>Exclusive Release</span>
      </div>
      <div className="nav-inner">
        <div className="nav-l">
          <button
            className="mob-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
          >
            ☰
          </button>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
        <Link to="/" className="nav-logo-container">
          <img src="/images/logo.png" alt="Hazed Studios" className="nav-logo-img" />
        </Link>
        <div className="nav-r">
          <button className="nav-search" onClick={onOpenSearch}>
            <Search size={18} />
          </button>
          <button className="nav-cart-btn" onClick={onOpenCart}>
            Cart ({cart.length})
          </button>
        </div>
      </div>

      <div className={`mob-menu-ov ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mob-menu-inner">
          <button className="mob-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          <div className="mob-menu-links">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
