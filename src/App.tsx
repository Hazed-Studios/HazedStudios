import React, { useState } from 'react';
import ScrollToTop from './components/shared/ScrollToTop';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import Notification from './components/shared/Notification';
import CookieBanner from './components/shared/CookieBanner';
import SearchOverlay from './components/shared/SearchOverlay';
import AdminLogin from './components/admin/AdminLogin';
import AdminPanel from './components/admin/AdminPanel';
import Home from './pages/Home';
import Checkout from './pages/Checkout';
import Shop from './pages/Shop';
import Contact from './pages/Contact';
import Returns from './pages/Returns';
import Terms from './pages/Terms';
import Lookbook from './pages/Lookbook';

const App: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <Router basename="/HS-Website">
      <ScrollToTop />
      <Notification />
      <CookieBanner />
      <AdminLogin />
      <AdminPanel />
      
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Home onOpenCart={() => setIsCartOpen(true)} />
              <Footer />
            </>
          }
        />
        <Route
          path="/shop"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Shop onOpenCart={() => setIsCartOpen(true)} />
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Contact />
              <Footer />
            </>
          }
        />
        <Route
          path="/returns"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Returns />
              <Footer />
            </>
          }
        />
        <Route
          path="/terms"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Terms />
              <Footer />
            </>
          }
        />
        <Route
          path="/lookbook"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Lookbook />
              <Footer />
            </>
          }
        />
        <Route
          path="/checkout"
          element={
            <Checkout />
          }
        />
      </Routes>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </Router>
  );
};

export default App;
