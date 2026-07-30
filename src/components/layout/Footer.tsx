import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <div className="f-brand">HAZED.STUDIOS</div>
          <div className="f-tagline">
            The moment you change, we're already there. Cairo, Egypt.
          </div>
        </div>

        <div>
          <div className="f-col-lbl">Support</div>
          <ul className="f-links">
            <li><Link to="/contact">Contact Us</Link></li>
            <li><Link to="/returns">Returns</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>
        <div>
          <div className="f-col-lbl">Social Media</div>
          <div className="f-social">
            <a href="https://www.instagram.com/hazed.studios/" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://www.tiktok.com/@hazed.studios?lang=en" target="_blank" rel="noopener noreferrer">TikTok</a>
          </div>
        </div>
      </div>
      <div className="f-bottom">
        <div className="f-copy">© 2026 HAZED.STUDIOS</div>
        <div className="f-copy">Cairo, EG</div>
      </div>
    </footer>
  );
};

export default Footer;
