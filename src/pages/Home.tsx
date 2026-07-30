import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface HomeProps {
  onOpenCart: () => void;
}

const Home: React.FC<HomeProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  // Canvas particles
  useEffect(() => {
    const C = canvasRef.current;
    if (!C) return;
    const ctx = C.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const rsz = () => {
      C.width = window.innerWidth;
      C.height = window.innerHeight;
    };
    window.addEventListener('resize', rsz);
    rsz();

    const pts = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * C.width,
      y: Math.random() * C.height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      a: Math.random() * 0.5 + 0.1
    }));

    const draw = () => {
      ctx.clearRect(0, 0, C.width, C.height);
      ctx.fillStyle = 'var(--bg2)';
      ctx.fillRect(0, 0, C.width, C.height);

      pts.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = C.width;
        if (p.x > C.width) p.x = 0;
        if (p.y < 0) p.y = C.height;
        if (p.y > C.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(192, 127, 69, ${p.a})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      window.removeEventListener('resize', rsz);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="home-wrapper">
      <section className="hero" style={{ backgroundImage: `url('${import.meta.env.BASE_URL}images/hero-bg.png')` }}>
        <div className="hero-content" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <button
            className="hero-btn"
            onClick={() => navigate('/shop')}
          >
            <span>Shop Now</span>
          </button>
        </div>
      </section>

      <div className="mq">
        <div className="mq-track">
          {[...Array(12)].map((_, idx) => (
            <div className="mq-item" key={idx}>
              Through The Haze, Elegance Remains <span style={{ color: 'var(--cr)', margin: '0 8px', fontStyle: 'normal' }}>|</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Home;
