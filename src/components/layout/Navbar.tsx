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

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <nav style={{
      borderBottom: scrolled ? '1px solid var(--bd)' : 'none',
      backgroundColor: scrolled ? 'var(--bg)' : 'transparent',
      transition: 'background-color 0.3s ease, border-bottom 0.3s ease'
    }}>
      <div className="ann">
        <span>Free Shipping over 1990 EGP</span>
        <span className="ann-sep">|</span>
        <span>Exclusive Release</span>
      </div>
      <div className="nav-inner">
        <div className="nav-l">
          <button
            className="mob-menu-btn"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open Mobile Menu"
          >
            ☰
          </button>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/shop">Shop</Link>
            <Link to="/contact">Contact Us</Link>
          </div>
        </div>
        <Link to="/" className="nav-logo-container" aria-label="Go to Homepage">
          <img src={`${import.meta.env.BASE_URL}images/logo.png`} alt="Hazed Studios" className="nav-logo-img" />
        </Link>
        <div className="nav-r">
          <button className="nav-search" onClick={onOpenSearch} aria-label="Search Products">
            <Search size={18} />
          </button>
          <button className="nav-cart-btn" onClick={onOpenCart} aria-label="View Cart">
            Cart ({cart.length})
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 999,
            animation: 'fadeIn 0.3s ease-out'
          }}
        />
      )}

      <div className={`mob-menu-ov ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="mob-menu-inner">
          <button className="mob-menu-close" onClick={() => setMobileMenuOpen(false)}>×</button>
          <div className="mob-menu-links">
            <Link to="/" onClick={() => setMobileMenuOpen(false)}>Home</Link>
            <Link to="/shop" onClick={() => setMobileMenuOpen(false)}>Shop</Link>
            <Link to="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
          </div>

          <div style={{ display: 'flex', gap: '28px', justifyContent: 'flex-start', paddingLeft: '0px', marginTop: 'auto', paddingBottom: '0px', color: 'var(--dk)' }}>
            <a href="https://www.facebook.com/profile.php?id=61580681832839" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', transition: 'opacity 0.3s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
            <a href="https://www.instagram.com/hazed.studios/" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', transition: 'opacity 0.3s' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://www.tiktok.com/@hazed.studios?lang=en" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', transition: 'opacity 0.3s' }}>
              <svg width="21" height="24" viewBox="0 0 448 512" fill="currentColor">
                <path d="M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default React.memo(Navbar);
