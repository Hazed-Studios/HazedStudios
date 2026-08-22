/**
 * HAZED.STUDIOS AdminLogin Component
 * Integrates with useAdminStore for UI state, and Supabase Auth for real
 * database-enforced access (RLS policies require an authenticated session).
 */

import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../context/store';
import { supabase } from '../../lib/supabase';
import { Eye, EyeOff } from 'lucide-react';

const ADMIN_EMAIL = 'admin@hazedstudios.com';

const AdminLogin: React.FC = () => {
  const { isAdmin, login } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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
    setShowPassword(false);
  };

  // Only show when modal is open and user is not admin
  if (!isOpen && !isAdmin) return null;

  return (
    <div className={`adm-login ${isOpen && !isAdmin ? 'open' : ''}`}>
      {isOpen && !isAdmin && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(26, 18, 8, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#faf6f0', border: '1px solid rgba(192, 127, 69, 0.2)', borderRadius: '24px', padding: '40px', display: 'flex', flexDirection: 'column', gap: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '28px', color: '#1a1208', fontWeight: 400, textAlign: 'center' }}>Admin Access</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input type={showPassword ? "text" : "password"} placeholder="Enter password" value={password} onChange={(e) => { setPassword(e.target.value); setError(false); }} onKeyDown={(e) => { if (e.key === 'Enter') { handleLogin(); } }} autoFocus style={{ width: '100%', background: 'rgba(192, 127, 69, 0.05)', border: '1px solid rgba(154, 136, 120, 0.3)', borderRadius: '12px', padding: '14px 44px 14px 16px', color: '#1a1208', fontSize: '15px', fontFamily: "'Montserrat', sans-serif", outline: 'none', transition: 'all 0.3s' }} onFocus={(e) => { e.target.style.borderColor = '#C07F45'; e.target.style.background = 'transparent'; }} onBlur={(e) => { e.target.style.borderColor = 'rgba(154, 136, 120, 0.3)'; e.target.style.background = 'rgba(192, 127, 69, 0.05)'; }} disabled={loading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', background: 'none', border: 'none', cursor: 'pointer', color: '#9a8878', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {error && <div style={{ color: '#c0392b', fontSize: '13px', paddingLeft: '4px' }}>Incorrect password</div>}
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <button type="button" onClick={handleClose} style={{ flex: 1, background: 'transparent', color: '#9a8878', border: '1px solid rgba(154, 136, 120, 0.4)', padding: '14px', borderRadius: '12px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => { e.currentTarget.style.color = '#1a1208'; e.currentTarget.style.borderColor = '#1a1208'; }} onMouseOut={(e) => { e.currentTarget.style.color = '#9a8878'; e.currentTarget.style.borderColor = 'rgba(154, 136, 120, 0.4)'; }}>Cancel</button>
              <button type="button" onClick={() => handleLogin()} disabled={loading || !password} style={{ flex: 1, background: '#C07F45', color: '#faf6f0', border: 'none', padding: '14px', borderRadius: '12px', fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, cursor: (loading || !password) ? 'not-allowed' : 'pointer', transition: 'all 0.3s', boxShadow: '0 4px 14px rgba(192, 127, 69, 0.3)', opacity: (loading || !password) ? 0.5 : 1 }} onMouseOver={(e) => { if(!loading && password) { e.currentTarget.style.background = '#1a1208'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(26, 18, 8, 0.4)'; } }} onMouseOut={(e) => { e.currentTarget.style.background = '#C07F45'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(192, 127, 69, 0.3)'; }}>{loading ? 'Verifying...' : 'Unlock'}</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminLogin;
