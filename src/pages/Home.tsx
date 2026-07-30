import React, { useEffect, useRef } from 'react';

interface HomeProps {
  onOpenCart: () => void;
}

const Home: React.FC<HomeProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      <section className="hero">
        <canvas ref={canvasRef} className="hero-canvas" />
        <div className="hero-content" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(48px, 12vw, 84px)', fontWeight: 300, color: 'var(--dk2)', marginBottom: '40px', letterSpacing: '0.05em', textAlign: 'center' }}>
            HAZED.STUDIOS
          </div>
          <button
            className="btn-cr"
            style={{ padding: '20px 60px', textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: '12px', background: 'var(--cr)', color: 'var(--bg)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', boxShadow: '0 10px 30px rgba(192,127,69,0.2)' }}
            onClick={() => window.location.href = '/shop'}
          >
            Shop Now
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
