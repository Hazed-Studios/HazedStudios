import React, { useState, Suspense, lazy } from 'react';
import ScrollToTop from './components/shared/ScrollToTop';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import Notification from './components/shared/Notification';
import CookieBanner from './components/shared/CookieBanner';
import SearchOverlay from './components/shared/SearchOverlay';
import { useAdminStore } from './context/store';

// Lazy loaded components (code-splitting)
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const Home = lazy(() => import('./pages/Home'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Shop = lazy(() => import('./pages/Shop'));
const Contact = lazy(() => import('./pages/Contact'));
const Returns = lazy(() => import('./pages/Returns'));
const Terms = lazy(() => import('./pages/Terms'));
const Lookbook = lazy(() => import('./pages/Lookbook'));

// Sleek minimal loader
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '120px 0', width: '100%' }}>
    <div style={{ width: '24px', height: '24px', border: '2px solid var(--bd)', borderTopColor: 'var(--dk)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  </div>
);

const App: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isAdmin } = useAdminStore();

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <Notification />
      <CookieBanner />
      
      {/* Admin tools are completely excluded from the bundle for regular users */}
      <Suspense fallback={null}>
        <AdminLogin />
        {isAdmin && <AdminPanel />}
      </Suspense>
      
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Suspense fallback={<PageLoader />}><Home onOpenCart={() => setIsCartOpen(true)} /></Suspense>
              <Footer />
            </>
          }
        />
        <Route
          path="/shop"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Suspense fallback={<PageLoader />}><Shop onOpenCart={() => setIsCartOpen(true)} /></Suspense>
              <Footer />
            </>
          }
        />
        <Route
          path="/contact"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Suspense fallback={<PageLoader />}><Contact /></Suspense>
              <Footer />
            </>
          }
        />
        <Route
          path="/returns"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Suspense fallback={<PageLoader />}><Returns /></Suspense>
              <Footer />
            </>
          }
        />
        <Route
          path="/terms"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Suspense fallback={<PageLoader />}><Terms /></Suspense>
              <Footer />
            </>
          }
        />
        <Route
          path="/lookbook"
          element={
            <>
              <Navbar onOpenCart={() => setIsCartOpen(true)} onOpenSearch={() => setIsSearchOpen(true)} />
              <Suspense fallback={<PageLoader />}><Lookbook /></Suspense>
              <Footer />
            </>
          }
        />
        <Route
          path="/checkout"
          element={
            <Suspense fallback={<PageLoader />}><Checkout /></Suspense>
          }
        />
      </Routes>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </Router>
  );
};

export default App;
