/**
 * HAZED.STUDIOS AdminLogin Component
 * Integrates with useAdminStore for UI state, and Supabase Auth for real
 * database-enforced access (RLS policies require an authenticated session).
 */

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../context/store';
import { supabase } from '../../lib/supabase';

const ADMIN_EMAIL = 'admin@hazedstudios.com';

const AdminLogin: React.FC = () => {
  const { isAdmin, login } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  // Handle custom secure event from multi-tap
  useEffect(() => {
    const handleCustomOpen = () => setIsOpen(true);
    window.addEventListener('openAdminLogin', handleCustomOpen);
    return () => window.removeEventListener('openAdminLogin', handleCustomOpen);
  }, []);

  // Hidden admin shortcut: type "hazedadmin" or press Ctrl+Shift+A
  useEffect(() => {
    let secretBuf = '';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setIsOpen(true);
        return;
      }

      const activeEl = document.activeElement?.tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeEl || '')) return;

      secretBuf = (secretBuf + e.key).slice(-10).toLowerCase();
      if (secretBuf.includes('hazedadmin')) {
        secretBuf = '';
        setIsOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password,
      });

      if (authError) {
        setError(true);
        setPassword('');
        setLoading(false);
        return;
      }

      login();
      setIsOpen(false);
      setPassword('');
      setError(false);
    } catch (err) {
      console.error('Login error:', err);
      setError(true);
      setPassword('');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setPassword('');
    setError(false);
  };

  // Only show when modal is open and user is not admin
  if (!isOpen && !isAdmin) return null;

  return (
    <div className={`adm-login ${isOpen && !isAdmin ? 'open' : ''}`}>
      {/* Backdrop */}
      {isOpen && !isAdmin && (
        <div
          className="adm-login-backdrop"
          onClick={handleClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 9998,
          }}
        />
      )}

      {/* Modal */}
      <div
        className="adm-login-modal"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          background: 'var(--bg)',
          padding: '48px 40px',
          borderRadius: '4px',
          border: '1px solid var(--bd)',
          minWidth: '300px',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '28px',
              fontWeight: 300,
              letterSpacing: '0.15em',
              color: 'var(--dk)',
              margin: 0,
              marginBottom: '8px',
            }}
          >
            ADMIN ACCESS
          </h2>
          <p
            style={{
              fontSize: '11px',
              letterSpacing: '0.15em',
              color: 'var(--mu)',
              textTransform: 'uppercase',
              margin: 0,
            }}
          >
            Collection 01 Management
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            id="admPassInp"
            className="adm-pass-inp"
            type="password"
            placeholder="ENTER PASSPHRASE"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid var(--bd)',
              borderRadius: '2px',
              fontSize: '12px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: 'var(--bg2)',
              color: 'var(--dk)',
              marginBottom: '12px',
              fontFamily: "'Montserrat', sans-serif",
              boxSizing: 'border-box',
              transition: 'all 0.3s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--cr)';
              e.target.style.background = 'var(--bg)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--bd)';
              e.target.style.background = 'var(--bg2)';
            }}
          />

          {error && (
            <div
              className="adm-pass-err"
              style={{
                display: 'block',
                fontSize: '10px',
                letterSpacing: '0.15em',
                color: 'var(--red)',
                textTransform: 'uppercase',
                marginBottom: '16px',
                textAlign: 'center',
                animation: 'shake 0.3s',
              }}
            >
              ✕ INCORRECT PASSPHRASE
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              marginTop: '20px',
            }}
          >
            <button
              type="submit"
              disabled={loading || !password}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'var(--cr)',
                color: 'var(--bg)',
                border: 'none',
                borderRadius: '2px',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
                fontWeight: 500,
                transition: 'all 0.3s',
                opacity: loading || !password ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!loading && password) e.currentTarget.style.background = 'var(--crd)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--cr)';
              }}
            >
              {loading ? 'VERIFYING...' : 'ENTER'}
            </button>

            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1,
                padding: '12px 16px',
                background: 'transparent',
                color: 'var(--mu)',
                border: '1px solid var(--bd)',
                borderRadius: '2px',
                fontSize: '10px',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'var(--dk)';
                e.currentTarget.style.borderColor = 'var(--dk)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--mu)';
                e.currentTarget.style.borderColor = 'var(--bd)';
              }}
            >
              CANCEL
            </button>
          </div>
        </form>

        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            75% { transform: translateX(5px); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default AdminLogin;
