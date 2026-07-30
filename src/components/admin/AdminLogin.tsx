import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../context/store';

const AdminLogin: React.FC = () => {
  const { isAdmin, login } = useAdminStore();
  const [isOpen, setIsOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setPassword('');
      setError(false);
    }
  }, [isOpen]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === import.meta.env.VITE_ADMIN_PASS) {
      login();
      setIsOpen(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (!isOpen && !isAdmin) return null;

  return (
    <div className={`adm-login ${isOpen && !isAdmin ? 'open' : ''}`}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <input
          id="admPassInp"
          className="adm-pass-inp"
          type="password"
          placeholder="ENTER PASSPHRASE"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {error && <div className="adm-pass-err" style={{ display: 'block' }}>INCORRECT PASSPHRASE</div>}
      </form>
    </div>
  );
};

export default AdminLogin;
