import React, { useState, useEffect } from 'react';

const CookieBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!localStorage.getItem('hz_cookie')) {
        setShow(true);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const accept = () => {
    localStorage.setItem('hz_cookie', '1');
    setShow(false);
  };

  const decline = () => {
    setShow(false);
  };

  return (
    <div className={`cookie ${show ? 'show' : ''}`}>
      <div className="cookie-text">
        We use cookies to enhance your experience. By continuing to visit this site you agree to our use of cookies.{' '}
        <a href="#terms">Learn more</a>.
      </div>
      <div className="cookie-btns">
        <button className="btn-cd" onClick={decline}>
          Decline
        </button>
        <button className="btn-ca" onClick={accept}>
          Accept
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
