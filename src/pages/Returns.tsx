import React from 'react';
import { Link } from 'react-router-dom';

const Returns: React.FC = () => {
  return (
    <div className="page-container">
      <h1 className="page-title">Returns & Exchanges</h1>
      <div className="page-content">
        <p>
          At HAZED.STUDIOS, we hold ourselves to the highest standards of craftsmanship. We want you to be completely satisfied with your limited edition piece.
        </p>

        <h3>14-Day Return Policy</h3>
        <p>
          We accept returns and exchanges within 14 days of your order's delivery date. To be eligible for a return, your item must be unused, unwashed, and in the exact same condition that you received it. It must also include all original tags and premium packaging.
        </p>

        <h3>How to Initiate a Return</h3>
        <p>
          To initiate a return or exchange, please fill out our contact form or email our client services team at <a href="mailto:hazed.co.hr@gmail.com">hazed.co.hr@gmail.com</a> with your order number and the reason for your return. Our team will provide you with a return authorization and shipping instructions.
        </p>
        
        <div style={{ margin: '20px 0 10px 0', padding: '16px 20px', background: 'rgba(0,0,0,0.03)', borderLeft: '3px solid var(--cr)', borderRadius: '0 4px 4px 0' }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--cr)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Note: When making a return, you must send 2 clear photos of the product (front and back) showing the entire product in a formal way.
          </p>
        </div>

        <Link 
          to="/contact" 
          style={{ display: 'inline-block', margin: '10px 0 20px', padding: '12px 24px', background: 'var(--cr)', color: 'var(--bg)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px', fontWeight: 600, borderRadius: '4px', transition: 'opacity 0.3s' }}
          onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
        >
          Returns and Exchanges
        </Link>

        <h3>Refund Process</h3>
        <p>
          Once your return is received and inspected at our Cairo studio, we will send you an email to notify you of the approval or rejection of your refund. If approved, your refund will be processed and automatically applied to your original method of payment within 5-10 business days.
        </p>

        <h3>Exchanges</h3>
        <p>
          Direct exchanges for different sizes are subject to availability. If the desired size is sold out, we will process your request as a standard return.
        </p>
      </div>
    </div>
  );
};

export default Returns;
