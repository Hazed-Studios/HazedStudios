import React, { useState, useEffect } from 'react';
import { Check, ArrowRight, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../context/store';

const EarlyAccess: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPwd, setAdminPwd] = useState('');
  const [adminError, setAdminError] = useState('');

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && !isSubmitting) {
      setIsSubmitting(true);

      const { error } = await supabase
        .from('waitlist')
        .insert([{ email }]);

      setIsSubmitting(false);

      if (!error) {
        setSubmitted(true);
      } else {
        console.error('Error saving email:', error);
        alert('Something went wrong. Please try again.');
      }
    }
  };

  const handleUnlock = async () => {
    try {
      const msgBuffer = new TextEncoder().encode(adminPwd);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      if (hashHex === '801927bb48a9081b3a28e1fc7c29aed5b4b561d9a4096adce5b077f7eaf40713') {
        useAppStore.getState().unlockSite();
        navigate('/home');
      } else {
        setAdminError('Incorrect password');
      }
    } catch (e) {
      setAdminError('Error verifying password');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#faf6f0', // matches var(--bg)
      color: '#1a1208', // matches var(--dk)
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Montserrat', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Subtle background glow */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '100vw',
        height: '100vw',
        background: 'radial-gradient(circle, rgba(192, 127, 69, 0.05) 0%, rgba(250, 246, 240, 0) 70%)',
        pointerEvents: 'none'
      }}></div>

      {/* Header */}
      <header style={{
        padding: '20px 48px',
        display: 'flex',
        justifyContent: 'center',
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(-20px)',
        transition: 'all 1s ease-out'
      }}>
        <img
          src={`${import.meta.env.BASE_URL}images/logo.png`}
          alt="Hazed Studios"
          style={{ height: '140px', objectFit: 'contain' }}
        />
      </header>

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0 24px',
        textAlign: 'center',
        zIndex: 1,
        opacity: isLoaded ? 1 : 0,
        transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 1s ease-out 0.2s'
      }}>
        <h2 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 'clamp(40px, 8vw, 80px)',
          fontWeight: 300,
          lineHeight: 1.1,
          marginBottom: '16px',
          color: '#1a1208'
        }}>
          Redefining the Standard.<br />
          <em style={{ color: '#C07F45', fontStyle: 'italic' }}>Coming Soon.</em>
        </h2>

        <p style={{
          maxWidth: '500px',
          fontSize: '14px',
          lineHeight: 1.8,
          color: '#9a8878', // matches var(--mu)
          marginBottom: '24px',
          letterSpacing: '0.05em'
        }}>
          Be the first to experience our debut collection. Join the exclusive waitlist to secure early access and a <strong style={{ color: '#C07F45', fontWeight: 600 }}>special VIP discount</strong> on launch day.
        </p>

        <div style={{ width: '100%', maxWidth: '420px' }}>
          {submitted ? (
            <div style={{
              padding: '24px',
              border: '1px solid rgba(192, 127, 69, 0.3)',
              backgroundColor: 'rgba(192, 127, 69, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              animation: 'fadeIn 0.5s ease-out'
            }}>
              <Check size={28} color="#C07F45" />
              <p style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', fontStyle: 'italic', color: '#1a1208' }}>Welcome to our community.</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#9a8878', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Keep an eye on your inbox.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(154, 136, 120, 0.4)',
                  padding: '16px 0',
                  color: '#1a1208',
                  fontSize: '16px',
                  fontFamily: "'Montserrat', sans-serif",
                  outline: 'none',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderBottomColor = '#C07F45'}
                onBlur={(e) => e.target.style.borderBottomColor = 'rgba(154, 136, 120, 0.4)'}
              />
              <button
                type="submit"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#C07F45',
                  color: '#faf6f0',
                  border: 'none',
                  padding: '16px 24px',
                  fontSize: '12px',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginTop: '8px',
                  transition: 'background 0.3s, transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#1a1208'}
                onMouseOut={(e) => e.currentTarget.style.background = '#C07F45'}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Loading...' : 'Unlock Early Access'}</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '24px',
        fontSize: '11px',
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: '#9a8878',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 1s ease-out 0.4s'
      }}>
        <div style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
          &copy; {new Date().getFullYear()} Hazed Studios
          <Lock
            size={12}
            style={{ cursor: 'pointer', opacity: 0.5, transition: 'opacity 0.3s' }}
            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
            onMouseOut={(e) => e.currentTarget.style.opacity = '0.5'}
            onClick={() => setShowAdminModal(true)}
          />
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#1a1208'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>Instagram</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#1a1208'} onMouseOut={(e) => e.currentTarget.style.color = 'inherit'}>TikTok</a>
        </div>
      </footer>

      {showAdminModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(250, 246, 240, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ background: '#faf6f0', border: '1px solid rgba(192, 127, 69, 0.3)', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', maxWidth: '320px', animation: 'fadeIn 0.3s ease-out' }}>
            <h3 style={{ margin: 0, fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: '#1a1208', fontWeight: 300 }}>Admin Access</h3>
            <input type="password" placeholder="Enter password" value={adminPwd} onChange={(e) => { setAdminPwd(e.target.value); setAdminError(''); }} onKeyDown={(e) => { if (e.key === 'Enter') { handleUnlock(); } }} autoFocus style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(154, 136, 120, 0.4)', padding: '12px 0', color: '#1a1208', fontSize: '14px', fontFamily: "'Montserrat', sans-serif", outline: 'none', transition: 'border-color 0.3s' }} onFocus={(e) => e.target.style.borderBottomColor = '#C07F45'} onBlur={(e) => e.target.style.borderBottomColor = 'rgba(154, 136, 120, 0.4)'} />
            {adminError && <div style={{ color: '#c0392b', fontSize: '12px', marginTop: '-8px' }}>{adminError}</div>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => { setShowAdminModal(false); setAdminPwd(''); setAdminError(''); }} style={{ flex: 1, background: 'transparent', color: '#9a8878', border: '1px solid rgba(154, 136, 120, 0.4)', padding: '12px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s' }} onMouseOver={(e) => e.currentTarget.style.color = '#1a1208'} onMouseOut={(e) => e.currentTarget.style.color = '#9a8878'}>Cancel</button>
              <button onClick={() => { handleUnlock(); }} style={{ flex: 1, background: '#C07F45', color: '#faf6f0', border: 'none', padding: '12px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer', transition: 'background 0.3s' }} onMouseOver={(e) => e.currentTarget.style.background = '#1a1208'} onMouseOut={(e) => e.currentTarget.style.background = '#C07F45'}>Unlock</button>
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

export default EarlyAccess;
