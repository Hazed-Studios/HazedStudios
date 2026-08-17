import React, { useState, Suspense, lazy } from 'react';
import ScrollToTop from './components/shared/ScrollToTop';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import CartDrawer from './components/cart/CartDrawer';
import Notification from './components/shared/Notification';
import CookieBanner from './components/shared/CookieBanner';
import SearchOverlay from './components/shared/SearchOverlay';
import SplashScreen from './components/shared/SplashScreen';
import { useAdminStore } from './context/store';

// Lazy loaded components (code-splitting)
const AdminLogin = lazy(() => import('./components/admin/AdminLogin'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
// const Home = lazy(() => import('./pages/Home'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Shop = lazy(() => import('./pages/Shop'));
const Contact = lazy(() => import('./pages/Contact'));
const Returns = lazy(() => import('./pages/Returns'));
const Terms = lazy(() => import('./pages/Terms'));
const Lookbook = lazy(() => import('./pages/Lookbook'));
const EarlyAccess = lazy(() => import('./pages/EarlyAccess'));

// Sleek minimal loader
const PageLoader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', width: '100%', backgroundColor: '#0d0b06' }}>
    <img
      src={`${import.meta.env.BASE_URL}images/HazedStudios White (NoBackground).png`}
      alt="Loading..."
      style={{ height: '100px', objectFit: 'contain', animation: 'pulse 1.5s ease-in-out infinite' }}
    />
    <style>{`@keyframes pulse { 0%, 100% { opacity: 0.5; transform: scale(0.95); } 50% { opacity: 1; transform: scale(1); } }`}</style>
  </div>
);

const App: React.FC = () => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { isAdmin } = useAdminStore();

  return (
    <Router basename={import.meta.env.BASE_URL}>
      <SplashScreen />
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
            <Suspense fallback={<PageLoader />}><EarlyAccess /></Suspense>
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
