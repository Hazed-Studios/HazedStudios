import React from 'react';

const Lookbook: React.FC = () => {
  return (
    <div className="page-container" style={{ maxWidth: '1200px' }}>
      <h1 className="page-title" style={{ borderBottom: 'none', textAlign: 'center', marginBottom: '60px' }}>
        Lookbook — Collection 01
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2px', background: 'var(--bd)', border: '1px solid var(--bd)' }}>
        
        {/* Placeholder images - these can be replaced with actual lookbook shots */}
        <div style={{ background: 'var(--bg2)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: '11px', letterSpacing: '.2em' }}>
          LOOK 01
        </div>
        <div style={{ background: 'var(--bg2)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: '11px', letterSpacing: '.2em' }}>
          LOOK 02
        </div>
        <div style={{ background: 'var(--bg2)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: '11px', letterSpacing: '.2em' }}>
          LOOK 03
        </div>
        <div style={{ background: 'var(--bg2)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: '11px', letterSpacing: '.2em' }}>
          LOOK 04
        </div>
        <div style={{ background: 'var(--bg2)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: '11px', letterSpacing: '.2em' }}>
          LOOK 05
        </div>
        <div style={{ background: 'var(--bg2)', aspectRatio: '3/4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--mu)', fontSize: '11px', letterSpacing: '.2em' }}>
          LOOK 06
        </div>

      </div>

      <div style={{ textAlign: 'center', marginTop: '60px' }}>
        <a href="/#collection" className="btn-dk" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Shop Collection
        </a>
      </div>
    </div>
  );
};

export default Lookbook;
