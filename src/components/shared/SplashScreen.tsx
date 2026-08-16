import React, { useEffect, useState } from 'react';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Keep the splash screen visible for 1.8 seconds, then start fading out
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 1000); // 1000ms transition matches CSS
    }, 1800);

    // Lock body scroll while splash is active
    document.body.style.overflow = 'hidden';
    
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: isFadingOut ? 'none' : 'auto', // Prevent clicks while fading
      }}
    >
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: '#FCEDD6',
          backgroundImage: 'radial-gradient(circle at top right, rgba(151,198,224,0.7) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(192,127,69,0.7) 0%, transparent 60%)',
          backgroundSize: '100% 100%',
          opacity: isFadingOut ? 0 : 1,
          transition: 'opacity 0.8s cubic-bezier(0.65, 0, 0.35, 1)',
          zIndex: -1,
        }}
      />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        animation: isFadingOut 
          ? 'logoMoveUp 0.8s cubic-bezier(0.65, 0, 0.35, 1) forwards' 
          : 'splashPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      }}>
        <img 
          src={`${import.meta.env.BASE_URL}images/logo.png`} 
          alt="Hazed Studios" 
          style={{ width: '180px', height: 'auto', marginBottom: '32px' }} 
        />
        <div style={{ 
          width: '140px', 
          height: '4px', 
          backgroundColor: 'rgba(0,0,0,0.1)', 
          overflow: 'hidden', 
          position: 'relative',
          borderRadius: '4px',
          opacity: isFadingOut ? 0 : 1,
          transition: 'opacity 0.3s ease'
        }}>
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '40%',
            backgroundColor: 'var(--cr)',
            borderRadius: '4px',
            animation: 'splashLoad 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite'
          }} />
        </div>
      </div>
      <style>
        {`
          @keyframes splashPulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(0.98); }
          }
          @keyframes splashLoad {
            0% { left: -40%; }
            100% { left: 140%; }
          }
          @keyframes logoMoveUp {
            0% {
              transform: translateY(0) scale(1);
              opacity: 1;
            }
            100% {
              transform: translateY(-40vh) scale(0.6);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export default SplashScreen;
